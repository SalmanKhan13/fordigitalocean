const jwt = require("jsonwebtoken");
const fs = require("fs");
const Analytics = require('../models/Analytics');
// Public Key (must read as utf8)
var publicKey = fs.readFileSync("./public.key", "utf8");
var iss = "NxN Software";
var sub = "salman@user.org";
var aud = "http://nxn.net";
var exp = "24h";
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    Analytics
      .findOne()
      .then(doc => {
        console.log(`YAAR UNAUTH AUTHO HIT${doc}`)
        if (doc.unauthorizedrequest) {
          doc.unauthorizedrequest += 1;
          const objs = {};
          objs.unauthorizedrequest = doc.unauthorizedrequest;
          console.log(`OBJS HIT ${objs}`);
          Analytics.findOneAndUpdate(
            { $set: objs }
          ).then(aall => console.log(`Unauth hits of DB${aall}`));
          console.log('saved unathorizedrequest');
          //var sr = (doc.successfulrequest += 1);

        }
        // console.log(doc);
        //console.log("retrieved records:");
      })
      .catch(err => {
        console.error(err)
      })
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  var verifyOptions = {
    issuer: iss,
    subject: sub,
    audience: aud,
    maxAge: exp,
    algorithms: ["RS256"]
  };

  // Verify token
  try {
    const decoded = jwt.verify(token, publicKey, verifyOptions);

    req.user = decoded.user;

    next();
  } catch (err) {
    Analytics
      .findOne()
      .then(doc => {

        if (doc.unauthorizedrequest) {
          doc.unauthorizedrequest += 1;
          const objs = {};
          objs.unauthorizedrequest = doc.unauthorizedrequest;

          Analytics.findOneAndUpdate(
            { $set: objs }
          ).then(aall => console.log(`${aall}`));
        }
      })
      .catch(err => {
        console.error(err)
      })
    res.status(401).json({ msg: "Token is not valid" });
  }
};
