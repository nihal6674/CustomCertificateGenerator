module.exports = function formatCertificateNumber({
  certNumber,
  firstName,
  middleName,
  lastName,
}) {
  const clean = (str) =>
    str
      ?.trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

  const parts = [
    clean(certNumber),
    clean(firstName),
    middleName ? clean(middleName) : null,
    clean(lastName),
  ].filter(Boolean);

  return parts.join("_");
};
