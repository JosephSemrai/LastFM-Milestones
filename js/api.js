const express = require("express");
const Router = express.Router();
const db = require("mongodb");
const moment = require("moment");
const request = require("request");

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
        .sort({ datefield: -1 })
        .toArray()
        .then(result => {
          res.json(result);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
});

Router.get("/getImage/:username", (req, res) => {
  request.get(
    `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${
      req.params.username
    }&api_key=ec30204c033e99e3eb261b58374085c3&format=json`,
    (err, resp, body) => {
      try {
        if (err) console.log(err);
        if (resp.statusCode === 200) res.json(body);
      } catch (err) {
        console.log(err);
        res.status(404).send("Failed!");
      }
    }
  );
});

module.exports = Router;
