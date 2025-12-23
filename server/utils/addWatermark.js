const fs = require("fs");
const { PDFDocument, rgb, degrees } = require("pdf-lib");

module.exports = async (pdfPath, certificateNumber) => {
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    // Spacing between repeated watermarks
    const xSpacing = 200;
    const ySpacing = 150;

    for (let x = -width; x < width * 2; x += xSpacing) {
      for (let y = -height; y < height * 2; y += ySpacing) {
        page.drawText(certificateNumber, {
          x,
          y,
          size: 32,                 // slightly smaller for repetition
          rotate: degrees(45),
          color: rgb(0.6, 0.6, 0.6), // 👈 darker than before, still subtle
          opacity: 0.28,            // 👈 visible but not intrusive
        });
      }
    }
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);
};
