import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type ExportFormat = 'pdf' | 'html' | 'docx';

export interface ExportOptions {
  fileName: string;
  title: string;
  description?: string;
}

export class ExportService {
  static async exportToPDF(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<Blob | null> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const pages = element.querySelectorAll('.card');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(page, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 15000,
          removeContainer: false,
          windowWidth: 1200,
          width: page.scrollWidth,
          height: page.scrollHeight,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.body.querySelector('*');
            if (clonedElement) {
              (clonedElement as HTMLElement).style.padding = '0';
              (clonedElement as HTMLElement).style.margin = '0';
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.fontFamily = 'Arial, sans-serif';
                (htmlEl.style as any).webkitFontSmoothing = 'antialiased';
                (htmlEl.style as any).mozOsxFontSmoothing = 'grayscale';
              });
              const images = clonedDoc.querySelectorAll('img');
              images.forEach((img: HTMLImageElement) => {
                img.crossOrigin = 'anonymous';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
              });
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const availableHeight = pdfHeight - margin * 2;

        if (imgHeight > availableHeight) {
          const scaleFactor = availableHeight / imgHeight;
          const scaledWidth = imgWidth * scaleFactor;
          const scaledHeight = availableHeight;
          const xOffset = margin + (imgWidth - scaledWidth) / 2;

          pdf.addImage(
            imgData,
            'JPEG',
            xOffset,
            margin,
            scaledWidth,
            scaledHeight,
            undefined,
            'FAST'
          );
        } else {
          pdf.addImage(
            imgData,
            'JPEG',
            margin,
            margin,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
        }
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return null;
    }
  }

  static async exportToHTML(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<Blob> {
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    const clonedElement = element.cloneNode(true) as HTMLElement;

    const images = clonedElement.querySelectorAll('img');
    for (const img of Array.from(images)) {
      try {
        if (!img.src.startsWith('data:')) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const image = new Image();
          image.crossOrigin = 'anonymous';

          await new Promise((resolve) => {
            image.onload = () => {
              canvas.width = image.width;
              canvas.height = image.height;
              ctx?.drawImage(image, 0, 0);
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              img.src = dataUrl;
              resolve(null);
            };
            image.onerror = () => {
              console.warn('Impossible de charger l\'image:', img.src);
              resolve(null);
            };
            image.src = img.src;
          });
        }
      } catch (e) {
        console.error('Erreur conversion image:', e);
      }
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #111827;
      background: white;
      padding: 20px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .pdf-avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-page-break {
      page-break-before: always;
      break-before: always;
    }
    @media print {
      body {
        padding: 0;
      }
      .pdf-avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .pdf-page-break {
        page-break-before: always;
        break-before: always;
      }
    }
    @page {
      size: A4;
      margin: 1cm;
    }
    ${styles}
  </style>
</head>
<body>
  ${clonedElement.innerHTML}
</body>
</html>`;

    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  }

  static async exportToDocx(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<Blob> {
    const htmlBlob = await this.exportToHTML(element, options);
    const htmlContent = await htmlBlob.text();

    const docxHtml = htmlContent.replace(
      '<html lang="fr">',
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    );

    const fullDocxContent = `
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=BOUNDARY"

------=BOUNDARY
Content-Type: text/html; charset="utf-8"
Content-Location: file:///document.html

${docxHtml}

------=BOUNDARY--
`;

    return new Blob([fullDocxContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  static async downloadFile(blob: Blob, fileName: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async shareFile(
    blob: Blob,
    fileName: string,
    title: string,
    text: string
  ): Promise<boolean> {
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName)] })) {
      const file = new File([blob], fileName, { type: blob.type });

      try {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
        }
        return false;
      }
    }
    return false;
  }
}
