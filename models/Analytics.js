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
  totalrequest: {
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
    type: String
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
    type: String
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
  }



});

module.exports = Analytics = mongoose.model('analytics', UserSchema);
