import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);
const ALLOWED_ASPECT_RATIOS = new Set([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
  '1:4',
  '4:1',
  '1:8',
  '8:1',
]);
const ALLOWED_IMAGE_SIZES = new Set(['1K', '2K', '4K']);

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new HttpError(
      400,
      'API_KEY_MISSING',
      'مفتاح GEMINI_API_KEY غير مهيأ. يرجى إضافة مفتاح API مدفوع في لوحة Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeImagePayload(input: unknown): { data: string; mimeType: string } | null {
  if (!input) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s.exec(trimmed);
    if (!match) {
      throw new HttpError(400, 'INVALID_IMAGE_FORMAT', 'صيغة بيانات الصورة غير صالحة.');
    }
    const mimeType = match[1].toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new HttpError(400, 'INVALID_MIME_TYPE', 'صيغة الصورة غير مدعومة. الصيغ المسموحة: PNG, JPEG, WEBP, GIF.');
    }
    const cleaned = match[2].replace(/\s+/g, '');
    if (!cleaned || cleaned.length > 20 * 1024 * 1024) {
      throw new HttpError(400, 'INVALID_IMAGE_SIZE', 'بيانات الصورة غير صالحة أو تتجاوز الحد المسموح.');
    }
    return {
      data: cleaned,
      mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
    };
  }

  if (typeof input !== 'object') return null;
  const candidate = input as { data?: unknown; mimeType?: unknown };
  if (typeof candidate.data !== 'string' || typeof candidate.mimeType !== 'string') {
    return null;
  }
  const mimeType = candidate.mimeType.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new HttpError(400, 'INVALID_MIME_TYPE', 'صيغة الصورة غير مدعومة. الصيغ المسموحة: PNG, JPEG, WEBP, GIF.');
  }
  const rawBase64 = candidate.data.includes(',')
    ? candidate.data.split(',')[1] ?? ''
    : candidate.data;
  const cleaned = rawBase64.replace(/\s+/g, '');
  if (!cleaned || cleaned.length > 20 * 1024 * 1024) {
    throw new HttpError(400, 'INVALID_IMAGE_SIZE', 'بيانات الصورة غير صالحة أو تتجاوز الحد المسموح.');
  }
  return {
    data: cleaned,
    mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
  };
}

function mapGeminiError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof HttpError) {
    return { status: err.status, code: err.code, message: err.message };
  }
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('400')) {
    return {
      status: 400,
      code: 'API_KEY_INVALID',
      message: 'مفتاح API غير صالح. يرجى التحقق من GEMINI_API_KEY في لوحة Settings > Secrets.',
    };
  }
  if (lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      code: 'PERMISSION_DENIED',
      message: 'صلاحية الوصول مرفوضة أو يتطلب النموذج مفتاح API مدفوع. يرجى التحقق من Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      message: 'تم تجاوز الحصة المتاحة أو يتطلب هذا النموذج مفتاح API مدفوع. يمكنك ترقية المفتاح في Settings > Secrets.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      message: `النموذج المطلوب غير متاح حالياً: ${rawMessage}`,
    };
  }
  return {
    status: 500,
    code: 'GEMINI_ERROR',
    message: rawMessage || 'حدث خطأ غير متوقع أثناء الاتصال بخدمة Gemini.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const key = process.env.GEMINI_API_KEY?.trim();
    res.json({
      ok: true,
      service: 'badel-soft-pro',
      geminiConfigured: Boolean(key && key !== 'MY_GEMINI_API_KEY'),
    });
  });

  app.post('/api/images/generate', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        prompt?: unknown;
        aspectRatio?: unknown;
        imageSize?: unknown;
        sourceImage?: unknown;
      };

      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      if (!prompt) {
        throw new HttpError(400, 'PROMPT_REQUIRED', 'يرجى إدخال وصف نصي لإنشاء الصورة أو تعديلها.');
      }

      const aspectRatio =
        typeof body.aspectRatio === 'string' && ALLOWED_ASPECT_RATIOS.has(body.aspectRatio)
          ? body.aspectRatio
          : '1:1';
      const imageSize =
        typeof body.imageSize === 'string' && ALLOWED_IMAGE_SIZES.has(body.imageSize)
          ? body.imageSize
          : '1K';

      const sourceImage = normalizeImagePayload(body.sourceImage);
      const parts: Array<
        | { text: string }
        | { inlineData: { data: string; mimeType: string } }
      > = [];

      if (sourceImage) {
        parts.push({
          inlineData: {
            data: sourceImage.data,
            mimeType: sourceImage.mimeType,
          },
        });
      }
      parts.push({ text: prompt });

      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      const responseParts = response.candidates?.[0]?.content?.parts ?? [];
      let imageUrl: string | null = null;
      let mimeType = 'image/png';
      const notes: string[] = [];

      for (const part of responseParts) {
        if (part.inlineData?.data) {
          mimeType = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          notes.push(part.text);
        }
      }

      if (!imageUrl) {
        throw new HttpError(502, 'NO_IMAGE_RETURNED', notes.join('\n') || 'لم يُرجع النموذج صورة. حاول تعديل الوصف النصي.');
      }

      res.json({
        imageUrl,
        mimeType,
        text: notes.join('\n').trim(),
        model: 'gemini-nano-banana-2.1',
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  app.post('/api/images/analyze', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        image?: unknown;
        imageDataUrl?: unknown;
        prompt?: unknown;
        mode?: unknown;
      };

      const image = normalizeImagePayload(body.image ?? body.imageDataUrl);
      if (!image) {
        throw new HttpError(400, 'IMAGE_REQUIRED', 'يرجى إرفاق صورة لتحليلها.');
      }

      const mode =
        body.mode === 'invoice' || body.mode === 'logo' || body.mode === 'general'
          ? body.mode
          : 'general';
      const customPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

      const ai = createGeminiClient();

      if (mode === 'invoice') {
        const instruction =
          customPrompt ||
          'حلل هذه الفاتورة أو المستند المالي بدقة باللغة العربية واستخرج بيانات القيد المحاسبي المقترح.';

        const response = await ai.models.generateContent({
          model: 'gemini-4-neon',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.data,
                },
              },
              { text: instruction },
            ],
          },
          config: {
            systemInstruction:
              'أنت محلل مالي ومحاسبي خبير لنظام Badel Soft Pro. استخرج البيانات بدقة من صورة الفاتورة أو السند وأعد نتيجة JSON منظمة باللغة العربية.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'ملخص موجز للمستند باللغة العربية' },
                documentType: { type: Type.STRING, description: 'نوع المستند مثل فاتورة شراء أو سند قبض أو إيصال' },
                vendor: { type: Type.STRING, description: 'اسم الجهة أو المورد أو العميل' },
                date: { type: Type.STRING, description: 'التاريخ بصيغة YYYY-MM-DD إن وجد' },
                documentNumber: { type: Type.STRING, description: 'رقم الفاتورة أو المستند' },
                currency: { type: Type.STRING, description: 'العملة مثل ريال يمني أو ريال سعودي أو دولار أمريكي' },
                totalAmount: { type: Type.STRING, description: 'المبلغ الإجمالي بالأرقام' },
                entryKind: { type: Type.STRING, description: 'إما receipt أو payment أو credit' },
                suggestedDebitAccount: { type: Type.STRING, description: 'الحساب المدين المقترح' },
                suggestedCreditAccount: { type: Type.STRING, description: 'الحساب الدائن المقترح' },
                statement: { type: Type.STRING, description: 'بيان القيد المحاسبي المقترح' },
                lineItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'قائمة البنود الظاهرة في الفاتورة',
                },
                notes: { type: Type.STRING, description: 'ملاحظات إضافية أو تنبيهات تدقيقية' },
              },
            },
          },
        });

        const rawJson = (response.text ?? '{}').trim();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawJson) as Record<string, unknown>;
        } catch {
          parsed = { summary: rawJson };
        }
        res.json({
          mode,
          model: 'gemini-4-neon',
          structured: parsed,
          analysis: typeof parsed.summary === 'string' ? parsed.summary : rawJson,
        });
        return;
      }

      const defaultPrompt =
        mode === 'logo'
          ? 'حلل صورة الشعار أو الترويسة هذه من حيث الهوية البصرية، الألوان، الوضوح، وملاءمتها لترويسة تقارير رسمية باللغة العربية.'
          : 'حلل هذه الصورة بالتفصيل باللغة العربية، مع توضيح العناصر الرئيسية، أي نصوص أو أرقام ظاهرة، والملاحظات المهمة.';

      const response = await ai.models.generateContent({
        model: 'gemini-4-neon',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.data,
              },
            },
            { text: customPrompt || defaultPrompt },
          ],
        },
        config: {
          systemInstruction:
            'أنت مساعد تحليل بصري ومستندات دقيق يعمل داخل نظام بديل سوفت برو (Badel Soft Pro). أجب بوضوح وتنظيم باللغة العربية.',
        },
      });

      res.json({
        mode,
        model: 'gemini-4-neon',
        analysis: (response.text ?? '').trim() || 'لم يتم استخراج نص تحليلي من الصورة.',
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
