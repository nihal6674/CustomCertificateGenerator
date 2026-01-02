const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2Client");
const fs = require("fs");

module.exports = async ({ file, key }) => {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    })
  );

  return key; // store R2 key in DB
};
