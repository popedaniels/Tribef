exports.convertToPounds = (amount, currency) => {
  if (currency == "GBP") {
    return amount;
  } else if (currency == "USD") {
    return Math.trunc(amount * 0.72);
  } else if (currency == "NGN") {
    return Math.trunc(amount * 0.0036);
  }
};
