const { getSignedViewUrl } = require("../utils/r2SignedUrl");

async function generateFileViewUrl({ key, expiresIn }) {
  return getSignedViewUrl(key, expiresIn || 300);
}

module.exports = {
  generateFileViewUrl,
};
