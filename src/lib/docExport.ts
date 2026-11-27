/**
 * أدوات مشتركة لطباعة/تصدير أي منطقة من واجهة النظام كملف PDF أو ورقة A4.
 * تعتمد على html2canvas-pro (يدعم ألوان Tailwind الحديثة) + jspdf، وتُحمَّل عند الطلب فقط.
 */

export interface PdfExportOptions {
  /** اتجاه الورقة */
  landscape?: boolean;
  /** الهوامش بالمليمتر: أعلى، يمين، أسفل، يسار */
  margins?: [number, number, number, number];
  /** تصغير/تكبير نسبة المحتوى داخل العرض المتاح (1 = 100%) */
  scale?: number;
}

/** إضافة صنف الطباعة على body ثم إزالة الكلاسات بعد انتهاء الطباعة */
export function printArea(className = 'report-print-open', delay = 1200): void {
  document.body.classList.add(className);
  const cleanup = () => {
    document.body.classList.remove(className);
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.setTimeout(() => {
    window.print();
    window.setTimeout(cleanup, delay);
  }, 60);
}

/** تحويل عنصر HTML إلى صورة عالية الجودة على canvas */
export async function elementToCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas-pro');
  const width = Math.max(el.scrollWidth, el.clientWidth);
  const height = Math.max(el.scrollHeight, el.clientHeight);
  return html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
  });
}

/** تصدير عنصر إلى ملف PDF متعدد الصفحات A4 */
export async function exportElementToPdf(
  el: HTMLElement,
  fileName: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const [mt, mr, mb, ml] = options.margins || [10, 8, 10, 8];
  const canvas = await elementToCanvas(el);
  const pdf = new jsPDF({
    orientation: options.landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const availW = pageW - ml - mr;
  const availH = pageH - mt - mb;
  const ratio = options.scale && options.scale > 0 ? options.scale : 1;
  const imgW = availW * ratio;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pages = Math.max(1, Math.ceil((imgH - 0.5) / availH));
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  for (let p = 0; p < pages; p += 1) {
    if (p > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', ml, mt - p * availH, imgW, imgH);
  }
  const safe = fileName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'report';
  pdf.save(`${safe}.pdf`);
}
