// server/middleware/verifyStudent.js
// Christ University email domain verification.
// Used to gate review submission and community chat to verified students.

const ALLOWED_DOMAINS = [
  "christuniversity.in",
  "mca.christuniversity.in",
  "bca.christuniversity.in",
  "students.christuniversity.in",
];

/**
 * Check if an email belongs to a Christ University domain.
 * @param {string} email
 * @returns {boolean}
 */
export function isStudentEmail(email) {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}
