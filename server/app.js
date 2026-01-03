require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();

/* ---------------- CORS (ALLOW ALL FOR NOW) ---------------- */
app.use(
  cors({
    origin: true,          // allow all origins
    credentials: true,     // REQUIRED for cookies
  })
);

/* ---------------- MIDDLEWARE ---------------- */
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/templates", require("./routes/template.routes"));
app.use("/api/certificates", require("./routes/certificate.routes"));
app.use("/api/files", require("./routes/file.routes"));

app.get("/", (req, res) => {
  res.send("Server running");
});

/* ---------------- START SERVER ---------------- */
connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(3000, () =>
      console.log("Server started on port 3000")
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
