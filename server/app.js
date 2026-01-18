require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();

/* ---------------- CORS (ALLOW ALL FOR NOW) ---------------- */
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : [process.env.CLIENT_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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
    const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
