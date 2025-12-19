const fs = require('fs');
const path = require('path');

exports.saveFile = async (file, folder) => {
  const uploadDir = path.join(__dirname, '..', 'uploads', folder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  return filePath;
};
