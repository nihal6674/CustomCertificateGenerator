const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");

module.exports = (templateSource, data, outputPath) => {
  const content = Buffer.isBuffer(templateSource)
    ? templateSource
    : fs.readFileSync(templateSource, "binary");

  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue) => tagValue, // expects Buffer
    getSize: () => [80, 80],
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.setData({
    first_name: data.first_name || "",
    middle_name: data.middle_name || "",
    last_name: data.last_name || "",

    class_name: data.class_name || "",
    training_date: data.training_date || "",
    issue_date: data.issue_date || "",

    certificate_number: data.certificate_number || "",
    instructor_name: data.instructor_name || "",

    qr_code: data.qr_code || null,
    instructor_signature: data.instructor_signature || null,
  });

  try {
    doc.render();
  } catch (error) {
    console.error("DOCX render error:", error);
    throw error;
  }

  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(outputPath, buffer);
};
