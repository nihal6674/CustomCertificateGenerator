const mammoth = require('mammoth');
const fs = require('fs');

module.exports = async (docxPath, outputHtmlPath) => {
  const result = await mammoth.convertToHtml({ path: docxPath });

  fs.writeFileSync(outputHtmlPath, result.value);

  return outputHtmlPath;
};