const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

module.exports = (templatePath, data, outputPath) => {
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue) => tagValue,
    getSize: () => [120, 120] // QR size
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true
  });

  doc.setData(data);

  doc.render();

  const buffer = doc.getZip().generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
};
