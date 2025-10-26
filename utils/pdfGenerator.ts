// These are loaded from CDNs in index.html, so we declare them to satisfy TypeScript
declare const html2canvas: any;
declare const jspdf: any;

export const generatePdf = (elementId: string, fileName: string): void => {
  const input = document.getElementById(elementId);
  if (!input) {
    const errorMsg = `PDF generation failed: Element with id #${elementId} not found.`;
    console.error(errorMsg);
    alert(errorMsg);
    return;
  }

  // Use visibility to avoid layout reflow which can affect the capture
  const elementsToHide = input.querySelectorAll('.no-print');
  elementsToHide.forEach(el => (el as HTMLElement).style.visibility = 'hidden');

  html2canvas(input, {
    useCORS: true,
    scale: 2, // Higher scale for better quality
    backgroundColor: '#1f2937' // Match the dark theme background
  }).then((canvas: any) => {
    // Show the elements again immediately after capture
    elementsToHide.forEach(el => (el as HTMLElement).style.visibility = 'visible');

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = jspdf;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    const pdfImageWidth = pageWidth;
    const pdfImageHeight = pdfImageWidth / ratio;
    
    let heightLeft = pdfImageHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfImageWidth, pdfImageHeight);
    heightLeft -= pageHeight;

    // Add new pages if the content is longer than one page
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfImageWidth, pdfImageHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${fileName}.pdf`);
  }).catch((error: any) => {
    console.error("Error generating PDF:", error);
    // Ensure elements are shown again even if there's an error
    elementsToHide.forEach(el => (el as HTMLElement).style.visibility = 'visible');
    alert(`Sorry, an error occurred while generating the PDF. Please check the developer console for more details.`);
  });
};