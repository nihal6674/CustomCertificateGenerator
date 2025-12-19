const Certificate = require('../models/Certificate');

module.exports = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await Certificate.countDocuments({
    certificateNumber: { $regex: `^${dateStr}` }
  });

  return `${dateStr}-${count + 1}`;
};
