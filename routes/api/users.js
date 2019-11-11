const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
// Private Key (must read as utf8)
var privateKey = fs.readFileSync('./private.key', 'utf8');
router.get("/", (req, res) => res.send("User route"));
var iss = "NxN Software";
var sub = "salman@user.org";
var aud = "http://nxn.net";
var exp = "24h";
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }
    var signOptions = {
      issuer: iss,
      subject: sub,
      audience: aud,
      expiresIn: exp,
      algorithm: "RS256"
    };

    user = new User({
      name,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload, privateKey, signOptions,
      (err, token) => {

        if (err) throw err;
        console.log(token);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
