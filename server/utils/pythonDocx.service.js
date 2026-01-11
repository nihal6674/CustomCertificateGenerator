const axios = require("axios");

exports.generateCertificateDoc = async (pythonPayload) => {
  try {
    const response = await axios.post(
      `${process.env.DOCX_SERVICE_URL}/generate-docx`,
      pythonPayload,
      {
        timeout: 60000,
        headers: {
          "x-internal-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );

    return response.data; // { key: "certificates/....pdf" }
  } catch (err) {
    console.error(
      "PYTHON DOCX ERROR:",
      err.response?.data || err.message
    );
    throw new Error("Failed to generate certificate document");
  }
};
