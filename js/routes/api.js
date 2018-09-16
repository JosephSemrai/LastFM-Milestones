const express = require("express");
const db = require("mongodb");
const moment = require("moment");
const request = require("request-promise");
const Promise = require("bluebird");
const LastFM = require("../lastfm");

const Router = express.Router();

Router.get("/recentRequests", (req, res) => {
  let client = db.MongoClient;
  client
    .connect(
      process.env.MONGODB,
      {
        useNewUrlParser: true
      }
    )
    .then(client => {
      let db = client.db("lastmilestones");
      let collection = db.collection(
        process.env.DEBUG ? "requests" : "requests-release"
      );
      collection
        .find({
          date: {
            $gte: moment()
              .subtract(24, "hours")
              .toDate()
          }
        })
        .project({ _id: 0, user: 1, step: 1 })
        .sort({ date: -1 })
        .limit(20)
        .toArray()
        .then(result => {
          Promise.map(result, obj => {
            return request(
              `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${
                obj.user
              }&api_key=${process.env.API_KEY}&format=json`
            ).then(response => {
              response = JSON.parse(response);
              obj["image"] = response.user.image[1]["#text"];
              return obj;
            });
          }).then(results => {
            res.send(results);
          });
        });
    })
    .catch(err => {
      console.log(err);
    });
});

Router.get("/milestones/:user", (req, res) => {
  const user = req.params.user.trim();
  const step = isNaN(parseInt(req.query.step)) ? 1000 : req.query.step;
  const showFirst = req.query.showFirst;
  const ref = req.query.ref;

  LastFM.getUserMilestones(user, step, showFirst, ref).then((results) => {
    res.send({
      err: -1, 
      body: results
    });
  }).catch((err) => {
    res.send({
      err: 1, 
      message: err.message
    })
  });
});

module.exports = Router;
