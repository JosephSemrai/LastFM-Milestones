const express = require("express");
const router = express.Router();
const request = require("request");
const requestPromise = require("request-promise");
const moment = require("moment");
const numeral = require("numeral");
const Promise = require("bluebird");
const server = require("../index");

router.post("/", (req, res) => {
  if (Object.keys(req.body).length == 0) {
    req.session.error = "Invalid parameters for processing!";
    res.redirect("/");
    return;
  }
  const username = req.body.user.trim();
  const step = isNaN(parseInt(req.body.step)) ? 10000 : parseInt(req.body.step);
  if (username.length < 1) {
    req.session.error = "Name should be at least 1 character long!";
    res.redirect("/");
    return;
  }
  req.session.user = username;
  req.session.showFirst = req.body.showFirst;
  server.parameters.user = username;
  if (step < 100) {
    req.session.error = "Step cannot be less than 100!";
    res.redirect("/");
    return;
  }
  req.session.step = step;
  request.get(
    "http://ws.audioscrobbler.com/2.0/?method=user.getinfo" +
      server.formatParams(server.parameters),
    (error, getRequest, body) => {
      const userJson = JSON.parse(body);
      if (userJson.error) {
        req.session.error = `User with name "${username}" was not found!`;
        res.redirect("/");
        return;
      }
      if (Math.round(userJson.user.playcount / step) > 400) {
        req.session.error =
          "The result is too long to process, please increase the step!";
        res.redirect("/");
        return;
      }
      if (Math.floor(userJson.user.playcount / step) <= 0) {
        req.session.error = `Selected step, ${step}, is bigger than your number of scrobbles! Please decrease the step to see results!`;
        res.redirect("/");
        return;
      }
      server.parameters.limit = 1;
      let milestonesUrls = [];
      const startPoint = req.body.showFirst
        ? userJson.user.playcount
        : userJson.user.playcount - step;
      for (let i = startPoint; i >= 0; i -= step) {
        server.parameters.page = i;
        milestonesUrls.push({
          url:
            "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
            server.formatParams(server.parameters)
        });
      }
      Promise.map(milestonesUrls, obj => {
        return requestPromise(obj).then(body => {
          const milestoneResp = JSON.parse(body);
          let milestone = milestoneResp.recenttracks.track;
          milestone = milestone.length > 1 ? milestone[1] : milestone[0];
          const attr = milestoneResp.recenttracks["@attr"];
          let milestoneNumb = attr.totalPages - attr.page;
          if (parseInt(attr.total) !== userJson.user.playcount) {
            req.error = `Attention! You have ${numeral(
              userJson.user.playcount - attr.totalPages
            ).format(
              "0,0"
            )} scrobbles without date, so they are not included in the list below!`;
            milestoneNumb += userJson.user.playcount - attr.totalPages;
          }
          if (milestone) {
            milestone.milestoneNumb = milestoneNumb;
          }
          return milestone;
        });
      }).then(
        results => {
          res.render("milestones", {
            user: userJson.user,
            milestones: results,
            title: `${username} Milestones`,
            error: req.error,
            success: req.success,
            session: req.session,
            ref: req.body.ref,
            moment: moment,
            numeral: numeral
          });
        },
        err => {
          console.log(err);
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const name = req.query.user;
  const step = req.query.step;
  if (name) {
    req.session.error =
      "There are some internal changes, please press submit button to proceed!";
    req.session.user = name;
    req.session.step = step;
  }
  res.redirect("/");
});

module.exports = router;
