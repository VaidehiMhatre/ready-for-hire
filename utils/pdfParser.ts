// This is loaded from a CDN in index.html, so we declare it to satisfy TypeScript
declare const pdfjsLib: any;

/**
 * Extracts all text content from a given PDF file.
 * @param file The PDF file to parse.
 * @returns A promise that resolves with the full text content of the PDF.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }

            try {
                const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                resolve(fullText);
            } catch (error) {
                console.error("Error parsing PDF:", error);
                reject(new Error("Could not parse the PDF file. It might be corrupted or in an unsupported format."));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
};
