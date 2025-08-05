import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (
  element: HTMLElement,
  fileName: string,
): Promise<void> => {
  if (!element) {
    console.error('PDF Generation Error: The provided element is null.');
    return;
  }

  // The canvas is created with a light background to ensure readability in the PDF.
  const canvas = await html2canvas(element, {
    scale: 2, // Higher scale improves text clarity
    backgroundColor: '#ffffff', // Explicitly set a white background
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(fileName);
};
