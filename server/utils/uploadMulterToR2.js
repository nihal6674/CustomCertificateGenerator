const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2Client");

module.exports = async ({ file, key }) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid multer file: buffer missing");
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,          // ✅ FIX
      ContentType: file.mimetype,
    })
  );

  return key;
};
