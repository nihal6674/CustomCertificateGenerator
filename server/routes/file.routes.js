const router = require("express").Router();
const { viewFile } = require("../controllers/file.controller");
const auth = require("../middleware/auth.middleware");

router.get("/view", auth, viewFile);

module.exports = router;
