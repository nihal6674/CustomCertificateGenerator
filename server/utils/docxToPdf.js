const { exec } = require("child_process");
const path = require("path");

module.exports = (docxPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(docxPath);

    // ✅ OS-aware LibreOffice command
    const libreOfficeCmd =
      process.platform === "win32"
        ? `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`
        : "libreoffice";

    const command = `${libreOfficeCmd} \
--headless \
--nologo \
--nofirststartwizard \
--nodefault \
--nolockcheck \
--norestore \
--convert-to pdf \
"${docxPath}" \
--outdir "${outputDir}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("LibreOffice stdout:", stdout);
        console.error("LibreOffice stderr:", stderr);
        return reject(error);
      }

      resolve(docxPath.replace(/\.docx$/i, ".pdf"));
    });
  });
};
