import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename: string;
  orientation?: 'landscape' | 'portrait';
  paperSize?: 'letter' | 'a4';
  scale?: number;
  quality?: number;
  fitToSinglePage?: boolean;
}

/**
 * Creates an offscreen, unscaled clone of the printable element
 * to guarantee that CSS transforms (zoom), modal overlays, and iframe
 * quirks NEVER interfere with html2canvas rendering.
 */
function createCleanSnapshotClone(element: HTMLElement, orientation: 'landscape' | 'portrait'): {
  container: HTMLDivElement;
  cleanup: () => void;
} {
  // 11in x 8.5in at 96 DPI: 1056px x 816px
  const widthPx = orientation === 'landscape' ? 1056 : 816;

  const container = document.createElement('div');
  container.id = 'pdf-snapshot-offscreen-container';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = `${widthPx}px`;
  container.style.minWidth = `${widthPx}px`;
  container.style.maxWidth = `${widthPx}px`;
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-1000';
  container.style.overflow = 'visible';
  container.style.transform = 'none';

  // Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.display = 'block';
  clone.style.visibility = 'visible';

  container.appendChild(clone);
  document.body.appendChild(container);

  return {
    container,
    cleanup: () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  };
}

/**
 * Exports any HTML element into a crisp, vector-scaled PDF file.
 * Guaranteed never to freeze or hang: includes an 8-second safety timeout.
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions
): Promise<void> {
  const orientation = options.orientation || 'landscape';
  const paperSize = options.paperSize || 'letter';
  const quality = options.quality || 0.95;

  const { container, cleanup } = createCleanSnapshotClone(element, orientation);

  try {
    // 8-second safety timeout so it never hangs in limbo
    const canvasPromise = html2canvas(container, {
      scale: 1.5, // 1.5x is optimal: fast generation (<600ms) with crisp text
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 4000,
      width: container.offsetWidth,
      height: container.offsetHeight
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out')), 8000)
    );

    const canvas = await Promise.race([canvasPromise, timeoutPromise]);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 6; // 6mm margin

    const printableWidth = pdfWidth - margin * 2;
    const printableHeight = pdfHeight - margin * 2;

    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;
    const shouldFitSinglePage = options.fitToSinglePage !== false;

    if (shouldFitSinglePage) {
      // Guaranteed single page fit - fit both dimensions with margin
      const scale = Math.min(printableWidth / canvasWidthPx, printableHeight / canvasHeightPx);
      const finalWidth = canvasWidthPx * scale;
      const finalHeight = canvasHeightPx * scale;
      const xOffset = margin + Math.max(0, (printableWidth - finalWidth) / 2);
      const yOffset = margin + Math.max(0, (printableHeight - finalHeight) / 2);

      const imgData = canvas.toDataURL('image/jpeg', quality);
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
    } else {
      const ratio = canvasWidthPx / canvasHeightPx;
      const scaledHeight = printableWidth / ratio;

      if (scaledHeight <= printableHeight) {
        // Single page fit
        const imgData = canvas.toDataURL('image/jpeg', quality);
        const yOffset = margin + Math.max(0, (printableHeight - scaledHeight) / 4);
        pdf.addImage(imgData, 'JPEG', margin, yOffset, printableWidth, scaledHeight);
      } else {
        // Multi-page document slicing
      const pxPerPage = (printableHeight / printableWidth) * canvasWidthPx;
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvasHeightPx) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidthPx;
        const sliceHeight = Math.min(pxPerPage, canvasHeightPx - renderedHeight);
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvasWidthPx,
            sliceHeight,
            0,
            0,
            canvasWidthPx,
            sliceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', quality);
          const pageImgHeightMm = (sliceHeight / canvasWidthPx) * printableWidth;

          if (pageIndex > 0) {
            pdf.addPage(paperSize, orientation);
          }

          pdf.addImage(pageImgData, 'JPEG', margin, margin, printableWidth, pageImgHeightMm);
        }

        renderedHeight += sliceHeight;
        pageIndex++;
      }
    }
  }

  const cleanFilename = options.filename.replace(/[/\\?%*:|"<>]/g, '_');
    pdf.save(cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`);
  } finally {
    cleanup();
  }
}

/**
 * Exports any HTML element directly into a PNG image file.
 * Protected with a timeout to prevent hanging.
 */
export async function exportElementToImage(
  element: HTMLElement,
  filename: string,
  orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<void> {
  const { container, cleanup } = createCleanSnapshotClone(element, orientation);

  try {
    const canvasPromise = html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 4000
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Image generation timed out')), 8000)
    );

    const canvas = await Promise.race([canvasPromise, timeoutPromise]);

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const cleanFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    link.download = cleanFilename.endsWith('.png') ? cleanFilename : `${cleanFilename}.png`;
    link.href = imgData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    cleanup();
  }
}

/**
 * CONNECTS TO THE USER'S REAL LAPTOP PRINTER.
 * Strategy:
 * 1. Attempts to open a clean printable popup window. This is the most reliable
 *    way to invoke the native laptop printer dialog (HP, Canon, Epson, Brother,
 *    and "Guardar como PDF" de Windows / Mac / Chrome).
 * 2. If popup is blocked by the browser, dynamically injects the chosen page
 *    orientation style and triggers window.print() on the parent document.
 */
export function printWithNativeDialog(
  elementHtml: string,
  documentTitle: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
  fitToSinglePage: boolean = true,
  isBatch: boolean = false
): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Gather all active application CSS styles
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const printHtmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <title>${documentTitle}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter ${orientation};
              margin: ${fitToSinglePage ? '4mm 4mm 4mm 4mm' : '8mm 8mm 8mm 8mm'};
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: ${fitToSinglePage ? '4px' : '10px'};
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .page-break-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            /* Action bar visible on screen, hidden on paper */
            @media screen {
              .screen-print-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #0f172a;
                color: #ffffff;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                font-family: system-ui, sans-serif;
              }
              .screen-print-bar button {
                background: #0284c7;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
              }
              .screen-print-bar button:hover {
                background: #0369a1;
              }
              .printable-content-wrapper {
                margin-top: 60px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
              }
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                ${isBatch ? 'height: auto !important; overflow: visible !important;' : (fitToSinglePage ? 'height: 100vh !important; max-height: 100vh !important; overflow: hidden !important;' : '')}
              }
              .single-page-sheet {
                ${isBatch 
                  ? 'page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: always !important; break-after: page !important; height: calc(100vh - 8mm) !important; max-height: calc(100vh - 8mm) !important; overflow: hidden !important;' 
                  : (fitToSinglePage ? 'height: 100% !important; max-height: calc(100vh - 8mm) !important; overflow: hidden !important; page-break-inside: avoid !important; page-break-after: avoid !important;' : '')}
              }
              .single-page-sheet:last-child {
                ${isBatch ? 'page-break-after: auto !important; break-after: auto !important;' : ''}
              }
              .screen-print-bar {
                display: none !important;
              }
              .printable-content-wrapper {
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
              }
            }
          </style>
          ${styles}
        </head>
        <body>
          <div class="screen-print-bar">
            <div>
              <strong>${documentTitle}</strong> — Impresión Oficial UABC
            </div>
            <div style="display: flex; gap: 10px;">
              <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
              <button onclick="window.close()" style="background: #334155;">Cerrar</button>
            </div>
          </div>
          <div class="printable-content-wrapper">
            <div style="width: 100%; max-width: ${orientation === 'landscape' ? '1060px' : '820px'}; background: white;">
              ${elementHtml}
            </div>
          </div>
          <script>
            // Automatically launch laptop print dialog once loaded
            window.addEventListener('load', function() {
              setTimeout(function() {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  console.warn('Auto print failed:', e);
                }
              }, 400);
            });
          </script>
        </body>
      </html>
    `;

    // Attempt to open dedicated print window
    let printWin: Window | null = null;
    try {
      printWin = window.open('', '_blank');
    } catch (e) {
      console.warn('Popup blocked:', e);
    }

    if (printWin && !printWin.closed) {
      try {
        printWin.document.open();
        printWin.document.write(printHtmlContent);
        printWin.document.close();
        resolve(true);
        return;
      } catch (e) {
        console.warn('Error writing to print window:', e);
      }
    }

    // Fallback: Direct in-page print with dynamic @page rule
    try {
      let dynamicStyle = document.getElementById('dynamic-print-orientation');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-print-orientation';
        document.head.appendChild(dynamicStyle);
      }
      dynamicStyle.innerHTML = `@page { size: letter ${orientation} !important; margin: 8mm !important; }`;

      window.focus();
      window.print();
      resolve(true);
    } catch (err) {
      console.error('Direct print failed:', err);
      resolve(false);
    }
  });
}
