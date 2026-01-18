const sgMail = require("./sendgrid");

const {
  SENDGRID_FROM_EMAIL,
  SENDGRID_FROM_NAME,
} = process.env;

exports.sendCertificateStatusEmail = async ({
  to,
  studentName,
  certificateNumber,
  status,
  adminMessage,
}) => {
  const isRevoked = status === "REVOKED";

  const subject = isRevoked
    ? "Important: Your Training Certificate Has Been Revoked"
    : "Your Training Certificate Has Been Reinstated";

  const msg = {
    to,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME,
    },
    subject,

    text: `
Dear ${studentName},

Your training certificate (Certificate Number: ${certificateNumber})
has been ${isRevoked ? "revoked" : "reinstated"}.

${adminMessage ? `Message from administrator:\n${adminMessage}\n` : ""}

If you have questions, please reply to this email.

The Loss Prevention Group, Inc.
    `.trim(),

    html: `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6;">
  <p>Dear ${studentName},</p>

  <p>
    Your training certificate
    <strong>${certificateNumber}</strong>
    has been
    <strong>${isRevoked ? "revoked" : "reinstated"}</strong>.
  </p>

  ${
    adminMessage
      ? `
        <p style="margin-top:16px;">
          <strong>Message from the administrator:</strong>
        </p>
        <blockquote style="
          border-left:3px solid #ccc;
          padding-left:12px;
          color:#444;
        ">
          ${adminMessage}
        </blockquote>
      `
      : ""
  }

  <p style="margin-top:16px;">
    If you have any questions or believe this was done in error,
    please reply to this email.
  </p>

  <p>
    Sincerely,<br />
    <strong>The Loss Prevention Group, Inc. (LPG)</strong>
  </p>
</div>
    `,
  };

  await sgMail.send(msg);
};
