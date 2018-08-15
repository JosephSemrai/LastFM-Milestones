const express = require("express");
const router = express.Router();
const request = require("request-promise");
const server = require("../index");
const moment = require("moment");
const numeral = require("numeral");
const Promise = require("bluebird");

router.post("/", (req, res) => {
  let error, info;
  const username = req.body.user.trim();
  const step = isNaN(parseInt(req.body.step)) ? 10000 : parseInt(req.body.step);
  if (Object.keys(req.body).length == 0) {
    error = "Invalid parameters for processing!";
    showError(req, res, error);
    return;
  }
  if (username.length < 1) {
    error = "Name should be at least 1 character long!";
    showError(req, res, error);
    return;
  }
  if (step < 100) {
    error = "Step cannot be less than 100!";
    showError(req, res, error);
    return;
  }
  req.session.user = username;
  req.session.showFirst = req.body.showFirst;
  server.parameters.user = username;
  req.session.step = step;
  const options = {
    uri:
      "http://ws.audioscrobbler.com/2.0/?method=user.getinfo" +
      server.formatParams(server.parameters)
  };
  request(options)
    .then(body => {
      const userJson = JSON.parse(body);
      if (Math.round(userJson.user.playcount / step) > 400) {
        error = "The result is too long to process, please increase the step!";
        showError(req, res, error);
        return;
      }
      if (Math.floor(userJson.user.playcount / step) <= 0) {
        error = `Selected step, ${step}, is bigger than your number of scrobbles! Please decrease the step to see the results!`;
        showError(req, res, error);
        return;
      }
      server.parameters.limit = 1;
      let milestonesUrls = [];
      const startPoint = req.body.showFirst
        ? userJson.user.playcount
        : userJson.user.playcount - step;
      const endPoint = req.body.ref ? userJson.user.playcount - 1 * step : 1;
      for (let i = startPoint; i >= endPoint; i -= step) {
        server.parameters.page = i;
        milestonesUrls.push({
          uri:
            "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
            server.formatParams(server.parameters)
        });
      }
      Promise.map(milestonesUrls, obj => {
        return request(obj).then(body => {
          const milestoneResp = JSON.parse(body);
          let milestone = milestoneResp.recenttracks.track;
          milestone = milestone.length > 1 ? milestone[1] : milestone[0];
          const attr = milestoneResp.recenttracks["@attr"];
          let milestoneNumb = attr.totalPages - attr.page;
          if (parseInt(attr.total) !== userJson.user.playcount) {
            info = `Warning! You have ${numeral(
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
      })
        .then(results => {
          if (!process.env.DEBUG) sendLog(req.body);
          res.render("milestones", {
            user: userJson.user,
            milestones: results,
            info: info,
            title:
              `${username} ` +
              (req.body.ref ? "Suggested Milestone" : "Milestones"),
            error: req.error,
            success: req.success,
            session: req.session,
            ref: req.body.ref,
            moment: moment,
            numeral: numeral
          });
        })
        .catch(e => {
          console.log(e);
          error = "Failed to connect to Last.fm! Please try again later!";
          showError(req, res, error, e);
        });
    })
    .catch(e => {
      try {
        error = JSON.parse(e.response.body).message;
        showError(req, res, error);
      } catch (e) {
        console.log(e);
        error = "Failed to connect to Last.fm! Please try again later!";
        showError(req, res, error, e);
      }
    });
});

router.get("/", (req, res) => {
  const name = req.query.user;
  const step = req.query.step;
  if (name) {
    res.render("milestones_get", {
      name: name,
      step: step
    });
  } else res.redirect("/");
});

function showError(req, res, e, debug_e) {
  const options = req.body;
  const IP = req.connection.remoteAddress;
  if (!process.env.DEBUG) sendLog(options, IP, e, debug_e);
  req.session.error = e;
  res.redirect("/");
}

function sendLog(options, IP, error, debug_e) {
  const text = `🎉 <b>New Milestone Search</b> \n\n<b>Username:</b> ${
    options.user
  } \n<b>Step:</b> ${options.step}\n<b>Options: </b>${
    options.ref
      ? "suggested milestone"
      : options.showFirst
        ? "show first"
        : "none"
  }<b>\nPermalink:</b> http://lastmilestones.tk/milestones?user=${
    options.user
  }&step=${options.step}\n\n<b>${
    !error
      ? "No errors</b>"
      : "Error:</b>\n" + error + (debug_e ? debug_e.name + debug_e.message : "")
  }`;
  request({
    url: `https://api.telegram.org/bot${process.env.BOT_KEY}/sendMessage`,
    form: {
      chat_id: process.env.NEW_SEARCH_CHAT_ID,
      text: text,
      parse_mode: "HTML"
    },
    method: "POST"
  });
}
module.exports = router;
