const { exec } = require("child_process");
const path = require("path");

module.exports = (docxPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(docxPath);

    const libreOfficePath =
      `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

    const command = `${libreOfficePath} \
--headless \
--nologo \
--nofirststartwizard \
--nodefault \
--nolockcheck \
--norestore \
--convert-to pdf \
"${docxPath}" \
--outdir "${outputDir}"`;

    exec(command, { timeout: 60000 }, (error) => {
      if (error) return reject(error);

      resolve(docxPath.replace(".docx", ".pdf"));
    });
  });
};
