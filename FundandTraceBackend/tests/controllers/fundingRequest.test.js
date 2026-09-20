// const { app } = require("../../server");
// const server = app;
//Require the dev-dependencies
let chai = require("chai");
let chaiHttp = require("chai-http");
let server = require("../../server");
let should = chai.should();
const testUserId = "60f594c6cb5ed5000425c5ea";

chai.use(chaiHttp);
//Our parent block
describe("FundingRequests", () => {
  // beforeEach((done) => { //Before each test we empty the database
  //     Book.remove({}, (err) => {
  //        done();
  //     });
  // });
  /*
   * Test the /GET route
   */
  describe("/GET all Funding Requests", () => {
    it("it should GET all the FundingRequests in the db", (done) => {
      chai
        .request(server)
        .get(`/api/fundingRequests`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("Object");
          res.body.should.have.property("data");
          done();
        });
    });
    it("it should return a not found error", (done) => {
      chai
        .request(server)
        .get(
          `/api/fundingRequests/singleFundingRequest/6064eb12078c0e209098a125`
        )
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a("Object");
          res.body.should.have.property("error");
          done();
        });
    });
    it("it should return a server error", (done) => {
      chai
        .request(server)
        .get(`/api/fundingRequests/56738`)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.be.a("Object");
          res.body.should.have.property("error");
          done();
        });
    });
  });
});
