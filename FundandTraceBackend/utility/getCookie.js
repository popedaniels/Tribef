const getAppCookies = (req) => {
  // We extract the raw cookies from the request headers
  const rawCookies = req.headers.cookie.split("; ");
  // rawCookies = ['myapp=secretcookie, 'analytics_cookie=beacon;']

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    // parsedCookie = ['myapp', 'secretcookie'], ['analytics_cookie', 'beacon']
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
};

// Returns the value of the userId cookie
exports.getUserId = (req, res) => getAppCookies(req, res)["token"];
