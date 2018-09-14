const express = require("express");
const db = require("mongodb");
const moment = require("moment");
const request = require("request-promise");
const Promise = require("bluebird");
const utils = require("./utils");

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

  new Promise((resolve, reject) => {
    if (user.length < 1) reject("Name should be at least 1 character long!");
    if (step < 100) reject("Step cannot be less than 100!");
    utils.parameters.user = user;
    request(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo${utils.formatParams(
        utils.parameters
      )}`
    )
      .then(body => {
        body = JSON.parse(body);
        bodyUser = body.user;
        if (Math.round(bodyUser.playcount / step) > 400)
          reject(
            "The result is too long to process, please increase the step!"
          );
        if (Math.floor(bodyUser.playcount / step) <= 0)
          reject(
            `Selected step, ${step}, is bigger than your number of scrobbles! 
            Please decrease the step to see the results!`
          );
        utils.parameters.limit = 1;
        let milestonesUrls = [];
        const startPoint = showFirst
          ? bodyUser.playcount
          : bodyUser.playcount - step;
        const endPoint = ref ? bodyUser.playcount - 1 * step : 1;
        for (let i = startPoint; i >= endPoint; i -= step) {
          utils.parameters.page = i;
          milestonesUrls.push(
            `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks${utils.formatParams(
              utils.parameters
            )}`
          );
        }
        Promise.map(milestonesUrls, url => {
          return request(url).then(songBody => {
            songBody = JSON.parse(songBody);
            let milestone = songBody.recenttracks.track;
            milestone = milestone.length > 1 ? milestone[1] : milestone[0];
            const attr = songBody.recenttracks["@attr"];
            let milestoneNumb = attr.totalPages - attr.page;
            if (parseInt(attr.total) !== bodyUser.playcount)
              milestoneNumb += bodyUser.playcount - attr.totalPages;
            return {
              milestoneNumb: milestoneNumb,
              artist: milestone.artist["#text"],
              name: milestone.name,
              album: milestone.album["#text"],
              url: milestone.url,
              image: milestone.image[3]["#text"],
              date: {
                uts: milestone.date.uts,
                text: milestone.date["#text"]
              }
            };
          });
        })
          .then(results => {
            resolve({
              user: {
                playcount: bodyUser.playcount,
                name: bodyUser.name,
                url: bodyUser.url,
                country: bodyUser.country,
                image: bodyUser.image[3]["#text"],
                registred: {
                  uts: bodyUser.registered.unixtime,
                  text: bodyUser.registered["#text"]
                }
              },
              milestones: results
            });
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(JSON.parse(err.response.body).message);
      });
  })
    .then(value =>
      res.send({
        success: 1,
        data: value
      })
    )
    .catch(err => {
      console.log(err);
      res.send({
        success: -1,
        error: err
      });
    });
});

module.exports = Router;
