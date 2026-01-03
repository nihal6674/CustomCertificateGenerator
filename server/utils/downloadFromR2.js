const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2Client");

module.exports = async (key) => {
  const res = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );

  return Buffer.from(await res.Body.transformToByteArray());
};
