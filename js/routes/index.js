const express = require("express");
const numeral = require("numeral");
const sm = require("sitemap");
const Router = express.Router();

Router.get("/", (req, res) => {
  res.render("index", {
    session: req.session,
    error: req.error,
    success: req.success
  });
});

const sitemap = sm.createSitemap({
  hostname: "http://lastmilestones.tk",
  cacheTime: 600000,
  urls: [
    { url: "/", changeFreq: "daily", priority: 0.6 },
    { url: "/milestones", changeFreq: "daily", priority: 0.3 },
    { url: "/feedback", changeFreq: "monthly", priority: 0.1 }
  ]
});

Router.get("/sitemap.xml", (req, res) => {
  sitemap.toXML((e, xml) => {
    if (e) {
      return res.status(500).end();
    }
    res.header("Content-Type", "application/xml");
    res.send(xml);
  });
});

module.exports = Router;
