const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");

const EMPTY_IMAGE = fs.readFileSync(
  path.join(__dirname, "../assets/test-image.png")
);

module.exports = function generateDocx(
  templateSource,
  data,
  outputPath
) {
  const templateBuffer = Buffer.isBuffer(templateSource)
    ? templateSource
    : fs.readFileSync(templateSource);

  const zip = new PizZip(templateBuffer);

 const imageModule = new ImageModule({
  getImage: (value) => {
    if (!Buffer.isBuffer(value)) {
      throw new Error("Image tag value must be a Buffer");
    }
    return value;
  },

  // ✅ MUST always return [width, height]
  getSize: (img, tagValue, tagName) => {
    if (tagName === "qr_code") {
      return [120, 120];
    }
    if (tagName === "instructor_signature") {
      return [150, 60];
    }
    return [100, 100];
  },
});


  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
  });

  const safeData = {
    first_name: data.first_name ?? "",
    middle_name: data.middle_name ?? "",
    last_name: data.last_name ?? "",

    class_name: data.class_name ?? "",
    training_date: data.training_date ?? "",
    issue_date: data.issue_date ?? "",

    certificate_number: data.certificate_number ?? "",
    instructor_name: data.instructor_name ?? "",

    qr_code: Buffer.isBuffer(data.qr_code)
      ? data.qr_code
      : EMPTY_IMAGE,

    instructor_signature: Buffer.isBuffer(data.instructor_signature)
      ? data.instructor_signature
      : EMPTY_IMAGE,
  };

  try {
    doc.render(safeData);
  } catch (err) {
    console.error("DOCX render error:", err);
    throw err;
  }

  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
};
