// all money is stored as paise so we never use floats
// one rupee is 100 paise

const PAISE_PER_RUPEE = 100;
const BPS_DIVISOR = 10000; // 10000 basis points is 100 percent

// change rupees from the api into paise
function rupeesToPaise(rupees) {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

// change paise back into rupees for showing
function paiseToRupees(paise) {
  return paise / PAISE_PER_RUPEE;
}

// advance is the rate percent of the earning floored to whole paise
function calcAdvancePaise(earningPaise, rateBps) {
  return Math.floor((earningPaise * rateBps) / BPS_DIVISOR);
}

//  rupee string for logs and the demo
function formatPaise(paise) {
  return '₹' + paiseToRupees(paise).toFixed(2);
}

module.exports = {
  rupeesToPaise,
  paiseToRupees,
  calcAdvancePaise,
  formatPaise,
};
