const express = require('express');
const router = express.Router();
const request = require("request");
const requestPromise = require("request-promise");
const moment = require("moment");
const numeral = require("numeral");
const Promise = require("bluebird");

const parameters = {
    "format": "json",
    "api_key": process.env.API_KEY
}

router.get("/", (req, res) => {
    res.render("index", {
        "session": req.session
    });
    if (req.session.error) {
        req.session.destroy();   
    };
});

router.get("/milestones", (req, res) => {
    if (Object.keys(req.query).length == 0) {
        req.session.error = "Invalid parameters for processing!";
        res.redirect("/");
        return;
    }
    const username = req.query.user.trim();
    const step = isNaN(parseInt(req.query.step)) ? 10000 : parseInt(req.query.step);
    if (username.length < 1) {
        req.session.error = "Name should be at least 1 character long!";
        res.redirect("/");
        return;
    }    
    req.session.user = username;
    parameters.user = username;
    if (step < 100) {
        req.session.error = "Step cannot be less than 100!";
        res.redirect("/");
        return;
    }
    req.session.step = step;
    request.get("http://ws.audioscrobbler.com/2.0/?method=user.getinfo" + formatParams(parameters),
        (error, getRequest, body) => {
            const userJson = JSON.parse(body);
            if (userJson.error) {
                req.session.error = `User with name "${username}" was not found!`;
                res.redirect("/");
                return;
            }
            if (Math.floor(userJson.user.playcount / step) > 400) {
                req.session.error = "The result is too long to process, please increase the step!";
                res.redirect("/");
                return;
            }
            if (Math.floor(userJson.user.playcount / step) <= 0) {
                req.session.error = `Selected step, ${step}, is bigger than your number of scrobbles! Please decrease the step to see results!`;
                res.redirect("/");
                return;
            }
            parameters.limit = 1;
            let milestonesUrls = [];
            for (let i = userJson.user.playcount-step; i >= 0; i -= step) {
                parameters.page = i;
                milestonesUrls.push({
                    "url": "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" + formatParams(parameters)
                })
            }
            Promise.map(milestonesUrls, (obj) => {
                return requestPromise(obj).then((body) => {
                    const milestoneResp = JSON.parse(body);
                    let milestone = milestoneResp.recenttracks.track;
                    milestone = milestone.length > 1 ? milestone[1] : milestone[0];
                    const attr = milestoneResp.recenttracks["@attr"];
                    const milestoneNumb = parseInt(attr.total) - parseInt(attr.page);
                    if (parseInt(attr.total) !== userJson.user.playcount) {
                        req.session.error = "Last.fm API internal error! That's all we know :("
                        res.redirect("/");
                    }
                    milestone.milestoneNumb = milestoneNumb;
                    return milestone;
                })
            }).then((results) => {
                res.render("milestones", {
                    user: userJson.user,
                    milestones: results,
                    moment: moment,
                    numeral: numeral
                })
                // res.send(results);
            }, (err) => {
                console.log(err);
            })
        });
});

router.use(function(req, res, next) {
    res.redirect("/")
    next();
})


function formatParams(params) {
    return "&" + Object
        .keys(params)
        .map(function (key) {
            return key + "=" + encodeURIComponent(params[key])
        })
        .join("&")
}

module.exports = router;