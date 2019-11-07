const express = require("express");
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');
const geoip = require('geoip-lite');
const expressip = require('express-ip');
const connectDB = require('./config/db');
const app = express();
const Analytics = require('./models/Analytics');

// Connect Database
connectDB();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressip().getIpInfoMiddleware);

const FILE_PATH = 'stats.json';
var totalcount = 0;
const getRoute = (req) => {
  const route = (req.route ? req.route.path : ''); // check if the handler exist
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
  res.timeStart = new Date();
  // console.log(res.timeStart);


  res.on('finish', () => {

    const stats = readStats();

    var finaljson = {
      "method": req.method,
      "route_url": getRoute(req),
      "response_code": res.statusCode
    }
    const event = `Method: ${req.method} Route_Url: ${getRoute(req)} Status_Code: ${res.statusCode}`;
    //console.log(req._parsedUrl);

    const time = Date.now();
    const time2 = moment(time).format('MMMM Do YYYY, h:mm:ss a');
    finaljson.timeStamp = time2;
    //console.log(time2);
    const headerss = req.headers;
    stats[event] = stats[event] ? stats[event] + 1 : 1;
    finaljson.count = stats[event];
    // totalcount = stats[event];
    //console.log(totalcount);
    var timeStop = new Date();
    //console.log(timeStop);
    const responseTime = ((timeStop - res.timeStart) + 'ms');
    finaljson.responseTime = responseTime;
    //console.log(responseTime);
    //console.log(JSON.stringify(finaljson));
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const { headers } = req;
    const userAgent = headers['user-agent'];
    // console.log(userAgent);
    finaljson.fullUrl = fullUrl;
    finaljson.userAgent = userAgent;
    const { _headers } = res;
    const contentlength = _headers['content-length'];
    finaljson.requestSize = contentlength;
    const IPaddress = req.get('host');
    // console.log(IPaddress);
    finaljson.IPaddress = IPaddress;
    // console.log(contentlength);
    var myip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    //console.log(myip);
    const geo = geoip.lookup(myip);
    const { country, city, timezone, region } = geo;
    finaljson.country = country;
    finaljson.city = city;
    finaljson.timezone = timezone;
    finaljson.region = region;

    //console.log(geo);
    const requestbodysize = (req.socket.bytesRead);
    finaljson.responseSize = requestbodysize;
    const newItem = { ...finaljson }; // or { ...response } if you want to clone response as well

    //console.log((newItem));
    let db = new Analytics(newItem);
    db.save()
      .then(doc => {
        console.log(`it coming from db boss${doc}`);
      })
      .catch(err => {
        console.error(err)
      })
    /* if ("_contentLength" in res) {
       let resContentLength = res['_contentLength'];
       console.log(`if hits and result is : ${resContentLength}`);
     } else {
       // Try header
       if (res.hasHeader('content-length')) {
         let resContentLength = res.getHeader('content-length');
         console.log(`if/else hits and result is : ${resContentLength}`);
       }
     }
     */
    //console.log(JSON.stringify(newItem));
    //const responseStartTime = res.timeStart;
    //const ip = "207.97.227.239";


    if (res.statusCode === 200) {
      Analytics
        .findOne()
        .then(doc => {
          if (doc.successfulrequest) {
            doc.successfulrequest += 1;
            const objs = {};
            objs.successfulrequest = doc.successfulrequest;
            // totalcount += doc.successfulrequest;
            Analytics.findOneAndUpdate(
              { $set: objs }
            ).then(aall => console.log(aall));
            console.log('saved ok/request');
            //var sr = (doc.successfulrequest += 1);
          }

          // console.log(doc);
          //console.log("retrieved records:");
        })
        .catch(err => {
          console.error(err)
        })

    }
    else if (res.statusCode === 404) {
      console.log("Failed Block hits");
      Analytics
        .findOne()
        .then(docs => {

          if (docs.failedrequest) {
            docs.failedrequest += 1;
            const objs = {};
            objs.failedrequest = docs.failedrequest;
            //console.log(objs.failedrequest);
            // totalcount += docs.failedrequest;
            Analytics.findOneAndUpdate(
              { $set: objs }
            ).then(failall => console.log(failall)).catch(err => {
              console.error(err)
            });
            //var sr = (doc.successfulrequest += 1);
            console.log('saved fail/request');
          }

          // console.log(doc);
          //console.log("retrieved records:");
        })
        .catch(err => {
          console.error(err)
        })
    }
    else {
      Analytics
        .findOne()
        .then(docs => {
          console.log(docs);
          if (docs.otherrequest) {
            docs.otherrequest += 1;
            const objs = {};
            objs.otherrequest = docs.otherrequest;
            console.log(objs.otherrequest);
            //totalcount += docs.otherrequest;
            Analytics.findOneAndUpdate(
              { $set: objs }
            ).then(otherall => console.log(otherall));
            //var sr = (doc.successfulrequest += 1);
          }
          console.log('saved  it Man/else hit');
          // console.log(doc);
          //console.log("retrieved records:");
        })
        .catch(err => {
          console.error(err)
        })
    }
    //  console.log(totalcount);
    dumpStats(stats);
  })

  next();
})

app.get('/ip', (req, res) => {
  /* var myip = req.header('x-forwarded-for') || req.connection.remoteAddress;
   console.log(myip);
   const geo = geoip.lookup(myip);
   res.json(geo);
   
  //res.send(req.connection.remoteAddress);
  Analytics
    .findOne({ successfulrequest: Analytics.id })
    .then(doc => {
      //console.log(`result hit ${successfulrequest}`);
      console.log(`doc hit ${doc}`);
      if (doc.successfulrequest) {
        doc.successfulrequest += 1;

        const objs = {};
        objs.successfulrequest = doc.successfulrequest;
        totalcount += doc.successfulrequest;
        Analytics.findOneAndUpdate(
          { $set: objs }
        ).then(aall => console.log(aall));
        //var sr = (doc.successfulrequest += 1);
      }
      console.log('saved itititit Man');
      // console.log(doc);
      //console.log("retrieved records:");
    })
    .catch(err => {
      console.error(err)
    })
    */
});

app.get("/statistics/", (req, res) => {
  res.send(readStats());
})

app.post('/get_service_detail', (req, res) => {
  params = {
    id: req.body.id,
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_service_detail', params).then(responses => {
    res.send(responses.data);
  }).catch(err => res.status(404).json(err));
});



app.post('/sign_up', (req, res) => {
  params = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    primary_number: req.body.primary_number,
    password: req.body.password,
    email: req.body.email
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/sign_up', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/sign_in', (req, res) => {
  params = {
    primary_number: req.body.primary_number,
    password: req.body.password,
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/sign_in', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/verify_customer', (req, res) => {
  params = {
    customer_id: req.body.customer_id
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/verify_customer', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/forgot_password', (req, res) => {
  params = {
    primary_number: req.body.primary_number
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/forgot_password', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/update_profile', (req, res) => {
  params = {
    customer_id: req.body.customer_id,
    email: req.body.email,
    modified_by: req.body.modified_at,
    first_name: req.body.first_name,
    last_name: req.body.last_name

  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/update_profile', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/update_device_setting', (req, res) => {
  params = {
    customer_id: req.body.customer_id,
    device_name: req.body.device_name,
    default: req.body.default,
    device_id: req.body.device_id
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/update_device_setting', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/get_devices_customer_id', (req, res) => {
  params = {
    customer_id: req.body.customer_id

  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_devices_customer_id', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/get_device_data_by_device_id', (req, res) => {
  axios.post(`http://52.74.161.171/publish_mw_api/Api/mw/get_device_data_by_device_id?device_id=${req.query.device_id}`).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/get_invoice_list', (req, res) => {
  params = {
    customer_id: req.body.customer_id
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_invoice_list', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/get_invoice_detail', (req, res) => {
  params = {
    invoice_no: req.body.invoice_no
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_invoice_detail', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/get_service_list', (req, res) => {
  params = {
    customer_id: req.body.customer_id
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_service_list', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/get_service_detail', (req, res) => {
  params = {
    id: req.body.id
  }
  axios.post('http://52.74.161.171/publish_mw_api/Api/mw/get_service_detail', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/verify_coupon', (req, res) => {
  params = {
    coupon_no: req.body.coupon_no
  }
  axios.post('http://52.74.161.171/publish_mw_api/api/coupon/verify_coupon?coupon_no=Z1J5SI', params).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


app.post('/generate_coupon', (req, res) => {
  params = {
    customer_id: req.body.customer_id,
    coupon_type: req.body.month,
    contact_no: req.body.contact_no,
    no_of_days: req.body.no_of_days,
    coupon_devices: [
      {
        device_id: req.body.device_id
      }, {
        device_id: req.body.device_id
      }
    ]
  }
  axios.post('http://52.74.161.171/publish_mw_api/api/coupon/generate_coupon', params, { headers: { 'Accept': 'application/json' } }).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});



app.get('/get_coupons_by_customer_id/', (req, res) => {
  axios.get(`http://52.74.161.171/publish_mw_api/Api/coupon/get_coupons_by_customer_id?customer_id=${req.query.customer_id}`).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/deactivate_coupon', (req, res) => {
  axios.post(`http://52.74.161.171/publish_mw_api/api/coupon/deactivate_coupon?coupon_no=${req.query.coupon_no}`).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});

app.post('/verify_coupon', (req, res) => {
  axios.post(`http://52.74.161.171/publish_mw_api/api/coupon/verify_coupon?coupon_no=${req.query.coupon_no}`).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});



app.get('/get_devices_by_coupon_no', (req, res) => {
  axios.get(`http://52.74.161.171/publish_mw_api/api/coupon/get_devices_by_coupon_no?coupon_no=${req.query.coupon_no}`).then(response => {
    res.send(response.data);
  }).catch(err => res.status(404).json(err));
});


const PORT = process.env.PORT || 7777;
app.listen(PORT, err => {
  if (err) {
    throw err
  }
  console.log(`Server listening on port ${PORT}`)
})

























/*
const fs = require('fs');
const Request = require("request");
const http = require('http');
const util = require('util');
const urlParseLax = require('url-parse-lax');
const FILE_PATH = 'stats.json';
const getRoute = (req) => {
  const route = (req.route ? req.route.path : ''); // check if the handler exist
  const baseUrl = req.baseUrl ? req.baseUrl : ''; // adding the base url if the handler is child of other handler

  return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route';
}
return route

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
    const stats = readStats();
    const event = `METHOD  ${req.method} ROUTE_URL ${getRoute(req)} STATUS CODE ${res.statusCode}`;
    stats[event] = stats[event] ? stats[event] + 1 : + 1;
    stats[event] = 'Count' + stats[event];
    console.log(stats);
    dumpStats(stats);
  })
  next()
})

app.get("/", (req, res) => res.send("Testing for digital ocean.Are you hungry?"));

app.get("/api/", (req, res) => {

  res.send("its a simple get request").sendStatus(200);

})

app.get("/stats/", (req, res) => {
  res.json(readStats())
})

app.get("/salmantesting/", (req, res) => {
  res.json("Testing for commit");
})var Request = require("request");




  // console.log(res.route);

    console.log("statusCode : " + res.statusCode);
    // console.log(res.status);
    console.log("Path: " + req.route.path);
    console.log("Method:" + req.method);
    console.log(req.baseUrl);
    res.send(req.headers);


console.log(res.request.uri);
  // console.log(req);
  app.get('/hello/testing', (req, res) => {
  Request('http://157.245.127.29:7777/api/', (err, response, body) => {
    console.log("Data Included in Route Body : " + body);
    //console.log(response);
    console.log("statusCode : " + response.statusCode);
    console.log("statusMessage : " + response.statusMessage);
    //console.log(response.method);
    // console.log(response.href);
    console.log("httpVersion : " + response.httpVersion);
    // console.log(http.STATUS_CODES[response.statusCode]);
    // console.log(url.parse(respone.url));
    for (header in response.headers) {
      var value = response.headers[header];
      console.log(header + ': ' + value);
    }
    console.log(response.request.uri);
  });

});


const PORT = process.env.PORT || 7777;
app.listen(PORT, err => {
  if (err) {
    throw err
  }
  console.log(`Server listening on port ${PORT}`)
})

  let data = '';
    // A chunk of data has been recieved.
    response.on('data', (chunk) => {
      data += chunk;
    });
    response.on('end', () => {
      const event = `METHOD  ${req.method} ROUTE_URL ${getRoute(req)} STATUS CODE ${response.statusCode}`;
      stats[event] = stats[event] ? stats[event] + 1 : + 1;
      stats[event] = 'Count' + stats[event];
      console.log(stats);
      console.log(JSON.parse(data).explanation);
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
*/
/*for (header in req.headers) {
       if (header === "accept") continue;
       if (header === "accept-encoding") continue;
       if (header === "postman-token") continue;
      if (header === "cache-control") continue;
      var value = req.headers[header];
      let values = {};
      values.header = value;
      // console.log(values);
    }
    */