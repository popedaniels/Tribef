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
describe("Charity", () => {
  // beforeEach((done) => { //Before each test we empty the database
  //     Book.remove({}, (err) => {
  //        done();
  //     });
  // });
  /*
   * Test the /GET route
   */
  describe("/GET all charities", () => {
    it("it should GET all the charities", (done) => {
      chai
        .request(server)
        .get(`/api/charities`)
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
        .get(`/api/charities/charity/6064eb12078c0e209075a035`)
        .end((err, res) => {
          res.status.should.be.oneOf([404, 503]); // 404 with a DB, 503 when the DB is unreachable
          res.body.should.be.a("Object");
          res.body.should.have.property("error");
          done();
        });
    });
    it("it should reject a malformed id with 400", (done) => {
      chai
        .request(server)
        .get(`/api/charities/charity/56738`)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a("Object");
          res.body.should.have.property("error");
          done();
        });
    });
  });
});
