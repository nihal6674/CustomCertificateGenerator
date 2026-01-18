const sgMail = require("../utils/sendgrid");
const getPdfFromR2 = require("../utils/downloadFromR2"); // 👈 your file

const {
  SENDGRID_FROM_EMAIL,
  SENDGRID_FROM_NAME,
} = process.env;

if (!SENDGRID_FROM_EMAIL || !SENDGRID_FROM_NAME) {
  throw new Error(
    "SENDGRID_FROM_EMAIL and SENDGRID_FROM_NAME must be set"
  );
}

exports.sendCertificateEmail = async ({
  to,
  studentName,
  courseTitle,
  trainingDate,
  certificateNumber,
  pdfKey,
}) => {
  console.log(
    `📧 [SENDGRID] Preparing email → ${to} | Cert: ${certificateNumber}`
  );

  // 1️⃣ Fetch PDF from R2
  const pdfBuffer = await getPdfFromR2(pdfKey);

  // 2️⃣ Convert to Base64 (SendGrid requirement)
  const pdfBase64 = pdfBuffer.toString("base64");

  const msg = {
  to,
  from: {
    email: SENDGRID_FROM_EMAIL,
    name: SENDGRID_FROM_NAME,
  },
  subject: "Your LPG Training Completion Certificate – Attached",

  text: `
Dear ${studentName},

Attached is your Training Completion Certificate for the ${courseTitle}
you completed with The Loss Prevention Group, Inc. (LPG) on ${trainingDate}.

Please review the certificate for accuracy and retain a copy for your records.

Certificate Verification:
This certificate is protected by QR code verification. Alteration, misuse,
or payment reversal will result in revocation.

Important Notice:
Completion of this training does not guarantee licensing or employment.

Confidential Information:
This document contains personal information. Store it securely.

Thank you for choosing LPG!

The Loss Prevention Group, Inc.
524 7th Street, Oakland, CA 94607
www.lpgca.com
`,

  html: `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6;">

  <p>Dear ${studentName},</p>

  <p>
    Attached is your Training Completion Certificate for the
    <strong>${courseTitle}</strong> you completed with
    <strong>The Loss Prevention Group, Inc. (LPG)</strong>
    on ${trainingDate}.
  </p>

  <p>
    Please review the certificate for accuracy and retain a copy
    for your records. If your employer, licensing agency, or other
    organization requires proof of training, you may provide them
    with this certificate as documentation of course completion.
  </p>

  <p style="margin-top:20px;"><strong>Certificate Verification</strong></p>
  <p>
    This certificate is non-transferable and protected by QR code
    verification. Scanning the QR code confirms authenticity and
    status. Alteration, misuse, or payment reversal will result
    in revocation.
  </p>

  <p style="margin-top:20px;"><strong>Important Notice</strong></p>
  <p>
    Completion of this training does not guarantee approval,
    issuance, or renewal of any license, permit, certification,
    or employment. All determinations are made by the appropriate
    regulatory agency or employer.
  </p>

  <p style="margin-top:20px;"><strong>Confidential Information</strong></p>
  <p>
    This document may contain personal information and should be
    stored securely. If received in error, please notify us and
    delete the attachment.
  </p>

  <p>
    If you have any questions or believe corrections are needed,
    please reply to this email.
  </p>

  <p>
    Thank you for choosing LPG!
  </p>

  <p>
    Sincerely,<br />
    <strong>The Loss Prevention Group, Inc. (LPG)</strong><br />
    524 7th Street, Oakland, CA 94607<br />
    <a href="https://www.lpgca.com">www.lpgca.com</a><br />
    TFF 1308, TFB 1171
  </p>
</div>
`,

  attachments: [
    {
      content: pdfBase64,
      filename: `${certificateNumber}.pdf`,
      type: "application/pdf",
      disposition: "attachment",
    },
  ],
};


  await sgMail.send(msg);

  console.log(
    `✅ [SENDGRID] Email sent with attachment → ${to} | ${certificateNumber}`
  );
};
