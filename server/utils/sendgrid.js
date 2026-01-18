const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY not set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = sgMail;
