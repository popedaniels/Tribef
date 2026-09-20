exports.getCurrency = (currency) => {
  return currency == "USD" ? "$" : currency == "GBP" ? "£" : "₦";
};
