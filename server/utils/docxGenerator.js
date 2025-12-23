const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");

module.exports = (templatePath, data, outputPath) => {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue) => tagValue, // Buffer required
    getSize: () => [80, 80],
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.setData({
    first_name: data.first_name,
    last_name: data.last_name,
    training_date: data.training_date,
    instructor_name: data.instructor_name,
    certificate_number: data.certificate_number,
    issue_date: data.issue_date,

    qr_code: data.qr_code,
    instructor_signature: data.instructor_signature,
  });

  doc.render();

  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(outputPath, buffer);
};



// const fs = require('fs');
// const PizZip = require('pizzip');
// const Docxtemplater = require('docxtemplater');
// const ImageModule = require('docxtemplater-image-module-free');

// module.exports = (templatePath, data, outputPath) => {
//   const content = fs.readFileSync(templatePath, 'binary');
//   const zip = new PizZip(content);

//   const imageModule = new ImageModule({
//     centered: false,
//     getImage: (tagValue) => tagValue,
//     getSize: () => [120, 120] // QR size
//   });

//   const doc = new Docxtemplater(zip, {
//     modules: [imageModule],
//     paragraphLoop: true,
//     linebreaks: true
//   });

//   doc.setData(data);

//   doc.render();

//   const buffer = doc.getZip().generate({ type: 'nodebuffer' });
//   fs.writeFileSync(outputPath, buffer);
// };
