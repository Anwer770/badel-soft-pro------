import React, { useEffect, useRef, useState } from 'react';
import type { ExtractedInvoiceData } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface AiStudioDialogProps {
  open: boolean;
  initialTab: 'generate' | 'analyze';
  initialMode?: 'general' | 'invoice' | 'logo';
  initialAnalyzeImage?: string | null;
  currentLogo: string | null;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onApplyAsCompanyLogo: (dataUrl: string, fileName?: string) => void;
  onTransferInvoiceToJournal: (extracted: ExtractedInvoiceData) => void;
  onNotify: (msg: string) => void;
}

const ASPECT_RATIOS = ['1:1', '16:9', '4:3', '3:4', '9:16', '1:4', '4:1'];
const IMAGE_SIZES = ['1K', '2K', '4K'] as const;

const PROMPT_PRESETS = [
  {
    label: 'شعار شركة محاسبية احترافي',
    prompt:
      'Minimalist modern corporate emblem logo for a financial accounting ERP software company named Badel Soft, deep navy blue and gold geometric hexagon badge, clean white background, vector brand identity',
  },
  {
    label: 'ختم رسمي للشركة',
    prompt:
      'Clean circular official company stamp seal design in royal blue ink on crisp white background, geometric border rings, minimalist corporate emblem style',
  },
  {
    label: 'خلفية مكتب مالي',
    prompt:
      'Clean minimalist blue hexagonal geometric gradient corporate desktop wallpaper, subtle glass lighting, professional enterprise software aesthetic, no text',
  },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('تعذر قراءة الملف'));
    };
    reader.onerror = () => reject(new Error('فشل تحميل الصورة'));
    reader.readAsDataURL(file);
  });
}

export const AiStudioDialog: React.FC<AiStudioDialogProps> = ({
  open,
  initialTab,
  initialMode = 'general',
  initialAnalyzeImage = null,
  currentLogo,
  zIndex,
  onFocus,
  onClose,
  onApplyAsCompanyLogo,
  onTransferInvoiceToJournal,
  onNotify,
}) => {
  const [tab, setTab] = useState<'generate' | 'analyze'>(initialTab);

  // Generate / Edit state
  const [genPrompt, setGenPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResultUrl, setGenResultUrl] = useState<string | null>(null);
  const [genCaption, setGenCaption] = useState<string | null>(null);
  const genFileRef = useRef<HTMLInputElement>(null);

  // Analyze state
  const [analyzeImage, setAnalyzeImage] = useState<string | null>(null);
  const [analyzeMode, setAnalyzeMode] = useState<'general' | 'invoice' | 'logo'>(initialMode);
  const [analyzePrompt, setAnalyzePrompt] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeReport, setAnalyzeReport] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const analyzeFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setAnalyzeMode(initialMode);
      if (initialAnalyzeImage) {
        setAnalyzeImage(initialAnalyzeImage);
      }
      setGenError(null);
      setAnalyzeError(null);
    }
  }, [open, initialTab, initialMode, initialAnalyzeImage]);

  const handleGenerate = async () => {
    if (!genPrompt.trim()) {
      setGenError('الرجاء كتابة وصف الصورة أو التعديل المطلوب أولاً.');
      return;
    }
    setGenLoading(true);
    setGenError(null);
    try {
      const resp = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: genPrompt.trim(),
          aspectRatio,
          imageSize,
          sourceImage: sourceImage || undefined,
        }),
      });
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || 'فشل إنشاء أو تعديل الصورة.');
      }
      setGenResultUrl(payload.imageUrl || payload.imageDataUrl);
      setGenCaption(payload.text || null);
      onNotify(sourceImage ? 'تم تعديل الصورة بنجاح' : 'تم إنشاء الصورة بنجاح');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeImage) {
      setAnalyzeError('الرجاء رفع صورة لتحليلها أولاً.');
      return;
    }
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeReport(null);
    setExtractedData(null);
    try {
      const resp = await fetch('/api/images/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: analyzeImage,
          mode: analyzeMode,
          prompt: analyzePrompt.trim() || undefined,
        }),
      });
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || 'فشل تحليل الصورة.');
      }
      const st = payload.structured as
        | {
            summary?: string;
            vendor?: string;
            date?: string;
            documentNumber?: string;
            currency?: string;
            totalAmount?: string;
            entryKind?: string;
            suggestedDebitAccount?: string;
            suggestedCreditAccount?: string;
            statement?: string;
            lineItems?: string[];
            notes?: string;
          }
        | undefined;
      if (st) {
        const mappedEntryType: ExtractedInvoiceData['entryType'] =
          st.entryKind === 'receipt'
            ? 'مقبوضات'
            : st.entryKind === 'credit'
            ? 'ذمم'
            : 'مدفوعات';
        setExtractedData({
          vendorOrParty: st.vendor,
          date: st.date,
          documentNumber: st.documentNumber,
          currency: st.currency,
          totalAmount: st.totalAmount,
          entryType: mappedEntryType,
          suggestedDebitAccount: st.suggestedDebitAccount,
          suggestedCreditAccount: st.suggestedCreditAccount,
          statement: st.statement,
          itemsSummary: st.lineItems,
        });
        const itemLines = st.lineItems?.length ? `\n\nالبنود:\n- ${st.lineItems.join('\n- ')}` : '';
        const notesLine = st.notes ? `\n\nملاحظات: ${st.notes}` : '';
        setAnalyzeReport(`${payload.analysis || st.summary || ''}${itemLines}${notesLine}`.trim());
      } else {
        setAnalyzeReport(payload.analysis || '');
      }
      onNotify('اكتمل تحليل الصورة بنجاح');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحليل الصورة.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <DraggableWindow
      open={open}
      title="الاستوديو الذكي للصور والمستندات"
      width={1120}
      height={700}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-end border-b border-[#8e8e8e] px-1">
          <button
            type="button"
            onClick={() => setTab('generate')}
            className={`px-4 py-1.5 text-[14px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
              tab === 'generate'
                ? 'bg-white text-black relative top-[1px] pb-[7px] z-10'
                : 'bg-[#e8eaf0] text-[#333] hover:bg-[#e5f1fb]'
            }`}
          >
            إنشاء وتعديل الصور (Nano Banana 2.1)
          </button>
          <button
            type="button"
            onClick={() => setTab('analyze')}
            className={`px-4 py-1.5 text-[14px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
              tab === 'analyze'
                ? 'bg-white text-black relative top-[1px] pb-[7px] z-10'
                : 'bg-[#e8eaf0] text-[#333] hover:bg-[#e5f1fb]'
            }`}
          >
            تحليل الصور والمستندات (Gemini 4 Neon)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 bg-white border border-[#8e8e8e] border-t-0 p-4 overflow-y-auto erp-scrollbar">
          {tab === 'generate' ? (
            <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-5 h-full">
              {/* Controls */}
              <div className="flex flex-col gap-3">
                <div className="bg-[#f8f9fc] border border-[#d6d9e0] p-3 flex flex-col gap-2.5">
                  <label className="font-bold text-[13px]">وصف الصورة الجديدة أو التعديل المطلوب</label>
                  <textarea
                    rows={4}
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="اكتب وصفاً تفصيلياً بالعربية أو الإنجليزية..."
                    className="w-full border border-[#7a7a7a] bg-white p-2 text-[13px] outline-none focus:border-[#0078d7]"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setGenPrompt(p.prompt)}
                        className="erp-classic-btn px-2 py-1 text-[11px]"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f8f9fc] border border-[#d6d9e0] p-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[12px] mb-1">نسبة الأبعاد</label>
                    <select
                      dir="ltr"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="erp-field w-full text-center"
                    >
                      {ASPECT_RATIOS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[12px] mb-1">الدقة</label>
                    <select
                      dir="ltr"
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as '1K' | '2K' | '4K')}
                      className="erp-field w-full text-center"
                    >
                      {IMAGE_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-[#f8f9fc] border border-[#d6d9e0] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[12px]">صورة مرجعية للتعديل (اختياري)</span>
                    {sourceImage && (
                      <button
                        type="button"
                        onClick={() => setSourceImage(null)}
                        className="text-[12px] text-[#b00020] font-bold cursor-pointer hover:underline"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                  <input
                    ref={genFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await fileToDataUrl(f);
                      setSourceImage(url);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => genFileRef.current?.click()}
                      className="erp-classic-btn flex-1 h-[30px] text-[12px]"
                    >
                      رفع صورة للتعديل
                    </button>
                    {currentLogo && (
                      <button
                        type="button"
                        onClick={() => setSourceImage(currentLogo)}
                        className="erp-classic-btn flex-1 h-[30px] text-[12px]"
                      >
                        استخدام شعار الشركة الحالي
                      </button>
                    )}
                  </div>
                  {sourceImage && (
                    <div className="h-[92px] border border-[#ccc] bg-white flex items-center justify-center p-1">
                      <img
                        src={sourceImage}
                        alt="الصورة المرجعية للتعديل"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={genLoading}
                  onClick={handleGenerate}
                  className="erp-classic-btn focused h-[38px] text-[14px]"
                >
                  {genLoading
                    ? 'جارٍ المعالجة عبر gemini-nano-banana-2.1...'
                    : sourceImage
                    ? 'تعديل الصورة بالذكاء الاصطناعي'
                    : 'إنشاء الصورة بالذكاء الاصطناعي'}
                </button>

                {genError && (
                  <div className="border border-[#c62828] bg-[#ffebee] text-[#8e0000] p-2.5 text-[13px] font-semibold">
                    {genError}
                  </div>
                )}
              </div>

              {/* Output Preview */}
              <div className="border border-[#b8b8b8] bg-[#fafafa] flex flex-col overflow-hidden min-h-[360px]">
                <div className="bg-[#f0f0f0] border-b border-[#ccc] px-3 py-2 flex items-center justify-between">
                  <span className="font-bold text-[13px]">معاينة النتيجة</span>
                  {genResultUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={genResultUrl}
                        download={`badel-ai-${Date.now()}.png`}
                        className="erp-classic-btn px-3 py-1 text-[12px] no-underline"
                      >
                        تنزيل الصورة
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyAsCompanyLogo(genResultUrl, 'ai-company-logo.png');
                          onNotify('تم اعتماد الصورة كشعار رسمي للشركة');
                        }}
                        className="erp-classic-btn focused px-3 py-1 text-[12px]"
                      >
                        تعيين كشعار للشركة
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
                  {genLoading ? (
                    <div className="text-center text-[#005499] font-bold">
                      جارٍ توليد الصورة بدقة {imageSize}...
                    </div>
                  ) : genResultUrl ? (
                    <>
                      <img
                        src={genResultUrl}
                        alt="الصورة المولدة بالذكاء الاصطناعي"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-[430px] object-contain border border-[#ddd] bg-white shadow-xs"
                      />
                      {genCaption && (
                        <div className="mt-3 text-[13px] text-[#333] bg-white border border-[#ddd] p-2 w-full">
                          {genCaption}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-[#777] text-[14px]">
                      أدخل وصفاً واضغط «إنشاء الصورة بالذكاء الاصطناعي» لعرض النتيجة هنا.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-5 h-full">
              {/* Upload & Options */}
              <div className="flex flex-col gap-3">
                <input
                  ref={analyzeFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await fileToDataUrl(f);
                    setAnalyzeImage(url);
                    setAnalyzeReport(null);
                    setExtractedData(null);
                  }}
                />

                <div className="bg-[#f8f9fc] border border-[#d6d9e0] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px]">الصورة المطلوب تحليلها</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => analyzeFileRef.current?.click()}
                        className="erp-classic-btn px-3 py-1 text-[12px]"
                      >
                        اختيار صورة...
                      </button>
                      {currentLogo && (
                        <button
                          type="button"
                          onClick={() => setAnalyzeImage(currentLogo)}
                          className="erp-classic-btn px-2.5 py-1 text-[12px]"
                        >
                          الشعار الحالي
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-[220px] border border-[#bbb] bg-white flex items-center justify-center p-2 overflow-hidden">
                    {analyzeImage ? (
                      <img
                        src={analyzeImage}
                        alt="الصورة المرفوعة للتحليل"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => analyzeFileRef.current?.click()}
                        className="text-[#555] font-semibold text-[13px] cursor-pointer hover:text-[#0078d7]"
                      >
                        اضغط هنا لرفع صورة فاتورة أو مستند أو شعار
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#f8f9fc] border border-[#d6d9e0] p-3 flex flex-col gap-2.5">
                  <label className="font-bold text-[13px]">نوع التحليل</label>
                  <select
                    value={analyzeMode}
                    onChange={(e) =>
                      setAnalyzeMode(e.target.value as 'general' | 'invoice' | 'logo')
                    }
                    className="erp-field"
                  >
                    <option value="invoice">تحليل فاتورة / سند واستخراج بيانات قيد</option>
                    <option value="general">تحليل عام مفصل للصورة</option>
                    <option value="logo">تقييم الشعار والهوية البصرية للشركة</option>
                  </select>

                  <label className="font-bold text-[13px]">تعليمات إضافية (اختياري)</label>
                  <textarea
                    rows={3}
                    value={analyzePrompt}
                    onChange={(e) => setAnalyzePrompt(e.target.value)}
                    placeholder="مثال: ركز على المبلغ الإجمالي، الضريبة، واسم المورد..."
                    className="w-full border border-[#7a7a7a] bg-white p-2 text-[13px] outline-none focus:border-[#0078d7]"
                  />
                </div>

                <button
                  type="button"
                  disabled={analyzeLoading}
                  onClick={handleAnalyze}
                  className="erp-classic-btn focused h-[38px] text-[14px]"
                >
                  {analyzeLoading ? 'جارٍ التحليل عبر gemini-4-neon...' : 'تحليل الصورة الآن'}
                </button>

                {analyzeError && (
                  <div className="border border-[#c62828] bg-[#ffebee] text-[#8e0000] p-2.5 text-[13px] font-semibold">
                    {analyzeError}
                  </div>
                )}
              </div>

              {/* Analysis Output */}
              <div className="border border-[#b8b8b8] bg-[#fafafa] flex flex-col overflow-hidden min-h-[360px]">
                <div className="bg-[#f0f0f0] border-b border-[#ccc] px-3 py-2 flex items-center justify-between">
                  <span className="font-bold text-[13px]">نتائج التحليل الذكي</span>
                  {extractedData && (
                    <button
                      type="button"
                      onClick={() => onTransferInvoiceToJournal(extractedData)}
                      className="erp-classic-btn focused px-3 py-1 text-[12px]"
                    >
                      ترحيل البيانات إلى اليومية العامة
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto erp-scrollbar space-y-4">
                  {analyzeLoading ? (
                    <div className="text-center text-[#005499] font-bold py-12">
                      جارٍ فحص الصورة واستخراج البيانات...
                    </div>
                  ) : (
                    <>
                      {extractedData && (
                        <div className="bg-white border border-[#9bb7dc] p-3">
                          <div className="font-extrabold text-[14px] text-[#005499] mb-2">
                            البيانات المحاسبية المستخرجة
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[13px]">
                            <div>
                              <span className="text-[#555]">الجهة: </span>
                              <b>{extractedData.vendorOrParty || '—'}</b>
                            </div>
                            <div>
                              <span className="text-[#555]">التاريخ: </span>
                              <b>{extractedData.date || '—'}</b>
                            </div>
                            <div>
                              <span className="text-[#555]">رقم المستند: </span>
                              <b>{extractedData.documentNumber || '—'}</b>
                            </div>
                            <div>
                              <span className="text-[#555]">الإجمالي: </span>
                              <b>
                                {extractedData.totalAmount || '—'} {extractedData.currency || ''}
                              </b>
                            </div>
                            <div>
                              <span className="text-[#555]">نوع الحركة: </span>
                              <b>{extractedData.entryType || '—'}</b>
                            </div>
                            <div>
                              <span className="text-[#555]">القيد المقترح: </span>
                              <b>
                                من {extractedData.suggestedDebitAccount || '—'} إلى{' '}
                                {extractedData.suggestedCreditAccount || '—'}
                              </b>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[#555]">البيان: </span>
                              <b>{extractedData.statement || '—'}</b>
                            </div>
                          </div>
                        </div>
                      )}

                      {analyzeReport ? (
                        <div className="bg-white border border-[#ddd] p-3.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                          {analyzeReport}
                        </div>
                      ) : (
                        <div className="text-center text-[#777] text-[14px] py-12">
                          ارفع صورة واضغط «تحليل الصورة الآن» لعرض التقرير التفصيلي هنا.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2.5 flex justify-end">
          <button type="button" onClick={onClose} className="erp-classic-btn w-[130px] h-[32px]">
            إغلاق
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
