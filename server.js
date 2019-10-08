const express = require("express");

const app = express();

app.get("/", (req, res) => res.send("Testing for digital ocean.Are you hungry?"));

const PORT = process.env.PORT || 7777;
app.listen(PORT, err => {
  if (err) {
    throw err
  }
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`)
})