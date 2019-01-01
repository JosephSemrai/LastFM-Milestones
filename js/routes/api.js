const express = require("express");
const moment = require("moment");
const LastFM = require("../models/lastfm");
const Blog = new (require("../models/blog"))();
const Mongo = require("../log").Mongo;

const Router = express.Router();

Router.get("/recentRequests", async (req, res) => {
  const results = await Mongo.getFromLog(
    { _id: 0, name: 1, step: 1, image: 1 },
    {
      date: {
        $gte: moment()
          .subtract(24, "hours")
          .toDate()
      },
      success: 1,
      isSuggested: null,
    },
    20
  );
  res.send(results);
});

Router.get("/rr", async (req, res) => {
  const result = await Mongo.getFromLogAggregate();
  res.send(result);
})

Router.get("/milestones/:user", (req, res) => {
  const user = req.params.user.trim();
  const step = isNaN(parseInt(req.query.step)) ? 10000 : req.query.step;
  const showFirst = req.query.showFirst;
  const ref = req.query.ref;

  LastFM.getUserMilestones(user, step, showFirst, ref)
    .then(results => {
      res.send({
        err: -1,
        body: results
      });
    })
    .catch(err => {
      // res.send({
      //   err: 1,
      //   message: err.message
      // });
      throw err;
    });
});

Router.get("/latestPosts", (req, res) => {
  Blog.getLatestPinnedPost().then((result) => {
    res.send(result);
  })
})

module.exports = Router;
