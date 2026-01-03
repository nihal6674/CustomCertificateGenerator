const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");

module.exports = function generateDocx(
  templateSource,   // Buffer OR file path
  data,
  outputPath
) {
  /* ---------------- TEMPLATE LOAD ---------------- */
  const templateBuffer = Buffer.isBuffer(templateSource)
    ? templateSource
    : fs.readFileSync(templateSource); // ✅ BUFFER ONLY

  const zip = new PizZip(templateBuffer);

  /* ---------------- IMAGE MODULE ---------------- */
  const imageModule = new ImageModule({
    centered: false,

    getImage: (tagValue) => {
      if (!Buffer.isBuffer(tagValue)) {
        throw new Error("Image tag value must be a Buffer");
      }
      return tagValue;
    },

    getSize: () => [80, 80],
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
  });

  /* ---------------- SAFE DATA ---------------- */
  const safeData = {
    first_name: data.first_name || "",
    middle_name: data.middle_name || "",
    last_name: data.last_name || "",

    class_name: data.class_name || "",
    training_date: data.training_date || "",
    issue_date: data.issue_date || "",

    certificate_number: data.certificate_number || "",
    instructor_name: data.instructor_name || "",

    // 🔒 IMAGES MUST BE BUFFERS
    qr_code: Buffer.isBuffer(data.qr_code)
      ? data.qr_code
      : Buffer.alloc(0),

    instructor_signature: Buffer.isBuffer(data.instructor_signature)
      ? data.instructor_signature
      : Buffer.alloc(0),
  };

  /* ---------------- RENDER ---------------- */
  try {
    doc.render(safeData); // ✅ NEW API
  } catch (error) {
    console.error("DOCX render error:", error);
    throw error;
  }

  /* ---------------- WRITE FILE ---------------- */
  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
};