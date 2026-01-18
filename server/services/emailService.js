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
    subject:
      "Your LPG Training Completion Certificate – Attached",

    html: `
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

<hr />

<p><strong>Certificate Verification</strong></p>

<p>
This certificate is non-transferable and protected by QR code
verification. Scanning the QR code will confirm the authenticity
and status of the certificate and display basic validation details
associated with the training record.
</p>

<p>
Alteration, misuse, or payment reversal (including chargebacks
or returned checks) will result in revocation. Revoked certificates
will not validate.
</p>

<hr />

<p><strong>Important Notice</strong></p>

<p>
Completion of this training does not guarantee approval,
issuance, or renewal of any license, permit, certification,
or employment. All licensing and eligibility determinations
are made solely by the appropriate regulatory agency or employer.
</p>

<p>
This certificate confirms successful completion of the
training course only.
</p>

<hr />

<p><strong>Confidential Information</strong></p>

<p>
This document may contain personal information and should be
stored securely. If you believe you received this email in error,
please notify us immediately and delete the attachment.
</p>

<p>
If you have any questions or believe corrections are needed,
please contact us by replying to this email.
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
