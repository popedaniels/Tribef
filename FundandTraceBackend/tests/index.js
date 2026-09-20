require("./controllers/campaign.test");
require("./controllers/users.test");
require("./controllers/charity.test");
require("./controllers/fundingRequest.test");
require("./controllers/auth.test");
require("./controllers/donations.test");
require("./controllers/paystackWebhook.test");
require("./controllers/flutterwaveWebhook.test");
require("./controllers/stripeWebhook.test");
require("./controllers/admin.test");
require("./controllers/stripeConnect.test");

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../server");

chai.use(chaiHttp);

after(() => {
  if (server && server.close) {
    server.close();
  }
});
