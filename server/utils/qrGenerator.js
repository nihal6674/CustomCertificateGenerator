const QRCode = require('qrcode');

module.exports = async (certificateNumber) => {
  const verifyUrl = `${process.env.VERIFY_BASE_URL}/${certificateNumber}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 300,
    errorCorrectionLevel: 'H'
  });

  return qrBuffer;
};
