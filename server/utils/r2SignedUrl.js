const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require("./r2Client");

async function getSignedViewUrl(key, expiresIn = 300) {
  if (!key) {
    throw new Error("R2 object key is required");
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

module.exports = {
  getSignedViewUrl,
};
