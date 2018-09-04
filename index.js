const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const sm = require("sitemap");
const numeral = require("numeral");

const app = express();
const parameters = {
  format: "json",
  api_key: process.env.API_KEY
};

const sitemap = sm.createSitemap({
  hostname: "http://lastmilestones.tk",
  cacheTime: 600000,
  urls: [
    {url: "/", changeFreq: 'daily', priority: 0.6},
    {url: "/milestones", changeFreq: 'daily', priority: 0.3},
    {url: "/feedback", changeFreq: 'monthly', priority: 0.1}
  ]
})

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.urlencoded({
    extended: true
  })
);
app.enable('trust proxy', true);

app.use(
  cookieSession({
    name: "session",
    overwrite: true,
    secret: process.env.SECRET
  })
);

app.use((req, res, next) => {
  req.error = req.session.error;
  if (req.session.error) {
    req.session.error = null;
  }
  req.success = req.session.success;
  if (req.session.success) {
    req.session.success = null;
  }
  next();
});

app.use((req, res, next) => {
  if (!parameters.api_key) {
    res.send("Last.fm API key is not set!");
  } else if (!process.env.CAPTCHA_SECRET) {
    res.send("Captcha secret is not set!");
  } else next();
});

app.get("/", (req, res) => {
  res.render("index", {
    session: req.session,
    numeral: numeral,
    error: req.error,
    success: req.success
  });
});

app.get("/sitemap.xml", (req, res) => {
  sitemap.toXML((e, xml) => {
    if (e) {
      return res.status(500).end();
    }
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  })
})

app.use("/milestones", require("./js/milestones"));
app.use("/feedback", require("./js/feedback"));
app.use("/widgets", require("./js/widgets"));

if (process.env.DEBUG) {
  app.use("/test", require("./js/test"));
  app.use("/search", require("./js/search"));
}

app.use((req, res, next) => {
  res.redirect("/");
  next();
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on port: " + port);
});

module.exports.formatParams = function formatParams(params) {
  return (
    "&" +
    Object.keys(params)
      .map(function(key) {
        return key + "=" + encodeURIComponent(params[key]);
      })
      .join("&")
  );
};

module.exports.parameters = parameters;
