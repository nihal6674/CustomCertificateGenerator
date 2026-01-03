const { generateFileViewUrl } = require("../services/file.service");

exports.viewFile = async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ message: "File key is required" });
    }

    // 🔐 Optional: restrict access
    // if (key.startsWith("certificates/") && req.user.role !== "ADMIN") {
    //   return res.status(403).json({ message: "Forbidden" });
    // }
    const user = req.user;

    if (key.startsWith("templates/") && user.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to view templates" });
  }

    const url = await generateFileViewUrl({
      key,
      expiresIn: 60 * 5, // 5 minutes
    });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate file URL" });
  }
};
