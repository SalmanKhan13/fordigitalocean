const express = require("express");
const fs = require('fs');
const FILE_PATH = 'stats.json';
const app = express();


const getRoute = (req) => {
  const route = req.route ? req.route.path : ''; // check if the handler exist
  const baseUrl = req.baseUrl ? req.baseUrl : ''; // adding the base url if the handler is child of other handler

  return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route';
}


// read json object from file
const readStats = () => {
  let result = {}
  try {
    result = JSON.parse(fs.readFileSync(FILE_PATH))
  } catch (err) {
    console.error(err)
  }
  return result
}

// dump json object to file
const dumpStats = (stats) => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(stats), { flag: 'w+' })
  } catch (err) {
    console.error(err)
  }
}

app.use((req, res, next) => {
  res.on('finish', () => {
    const stats = readStats()
    const event = `${req.method} ${getRoute(req)} ${res.statusCode}`
    stats[event] = stats[event] ? stats[event] + 1 : 1
    dumpStats(stats)
  })
  next()
})

app.get("/", (req, res) => res.send("Testing for digital ocean.Are you hungry?"));

app.get("/api/", (req, res) => {
  console.log("its a get request");
  res.send("its a get request").sendStatus(200);

})

app.get("/stats/", (req, res) => {
  res.json(readStats())
})

app.get("/salmantesting/", (req, res) => {
  res.json("Testing for commit");
})
const PORT = process.env.PORT || 7777;
app.listen(PORT, err => {
  if (err) {
    throw err
  }

  console.log(`Server listening on port ${PORT}`)
})