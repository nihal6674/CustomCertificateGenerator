const { exec } = require("child_process");
const path = require("path");

module.exports = (docxPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(docxPath);

    // Linux / Render command
    const command = `soffice \
--headless \
--nologo \
--nofirststartwizard \
--nodefault \
--nolockcheck \
--norestore \
--convert-to pdf \
"${docxPath}" \
--outdir "${outputDir}"`;

    exec(command, { timeout: 120000 }, (error) => {
      if (error) {
        console.error("PDF CONVERSION FAILED:", error);
        return reject(error);
      }

      resolve(docxPath.replace(".docx", ".pdf"));
    });
  });
};
