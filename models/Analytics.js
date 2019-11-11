const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  successfulrequest: {
    type: Number
  },
  failedrequest: {
    type: Number
  },
  otherrequest: {
    type: Number
  },
  unauthorizedrequest: {
    type: Number
  },
  totalrequest: {
    type: Number
  },
  datatransfer: {
    type: Number
  },
  method: {
    type: String
  },
  Route_Url: {
    type: String
  },
  response_code: {
    type: Number
  },
  timeStamp: {
    type: String
  },
  count: {
    type: Number
  },
  responseTime: {
    type: Number
  },
  fullUrl: {
    type: String
  },
  userAgent: {
    type: String
  },
  requestSize: {
    type: String
  },
  IPaddress: {
    type: String
  },
  responseSize: {
    type: Number
  },
  country: {
    type: String
  },
  city: {
    type: String
  },
  timezone: {
    type: String
  },
  region: {
    type: String
  },
  servicestatusCode: {
    type: Number
  },
  serviceresponseTime: {
    type: String
  },
  counter: {
    type: Number
  },
  averageresponsetime: {
    type: Number
  },
  sumresponsetime: {
    type: Number
  }
});

module.exports = Analytics = mongoose.model('analytics', UserSchema);
