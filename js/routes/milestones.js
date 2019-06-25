const express = require("express");
const moment = require("moment");
const LastFM = require("../models/lastfm");
const strings = require("../strings");
const MilestoneError = require("../errors/MilestoneError");
const { Mongo, Telegram } = require("../log");

const router = express.Router();

router.post("/", (req, res) => {
  const name = req.body.user.trim();
  const step = isNaN(parseInt(req.body.step)) ? 10000 : parseInt(req.body.step);
  const showFirst = true;
  const ref = req.body.ref;
  const options = {
    name: name,
    step: step,
    showFirst: showFirst,
    isSuggested: ref,
    date: moment().toDate()
  };
  req.session.user = name;
  req.session.showFirst = showFirst;
  req.session.step = step;
  LastFM.getUserMilestones(name, step, showFirst, ref)
    .then(results => {
      res.render("milestones", {
        user: results.user,
        milestones: results.milestones,
        info: results.warning,
        title: req.body.ref
          ? strings.suggestedMilestoneTitle.en(name)
          : strings.milestoneTitle.en(name),
        session: req.session,
        ref: req.body.ref,
        step: step
      });
      options.image = results.user.image;
      sendLog(options);
    })
    .catch(err => {
      if (err instanceof MilestoneError) {
        req.session.error = err.message;
        res.redirect("/");
      } else {
        req.session.error = strings.unknownError.en;
        res.redirect("/");
      }
      sendLog(options, err);
    });
});

router.get("/", (req, res) => {
  const name = req.query.user;
  const step = req.query.step;
  if (name) {
    LastFM.getUserInfo(name).then(results => {
      res.render("milestones_get", {
        name: name,
        step: step,
        user: results,
        title: req.body.ref
          ? strings.suggestedMilestoneTitle.en(name)
          : strings.milestoneTitle.en(name)
      });
    });
  } else res.redirect("/");
});

function sendLog(options, error) {
  options.success = error ? -1 : 1;
  if (error) {
    options.error = error.message;
    if (!process.env.DEBUG) Telegram.sendSearchAlert(options);
  }
  if (!process.env.DEBUG) Mongo.writeToLog(options);
}
module.exports = router;
