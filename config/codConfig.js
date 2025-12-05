

function isCodAllowedForPincode(pin = "") {
  const clean = String(pin).trim();

  // Valid 6-digit format check
  if (!/^[0-9]{6}$/.test(clean)) return false;

  // Dehradun rule: starts with "248"
  return clean.startsWith("248");
}

module.exports = {
  isCodAllowedForPincode,
};
