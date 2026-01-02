const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const r2 = require("./r2Client");

module.exports = async ({ filePath, key }) => {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: "application/pdf",
    })
  );

  return key; // store this in DB
};
