const express = require("express");
const path = require("path");
const moment = require("moment-timezone");
const cookieSession = require("cookie-session");

const app = express();
moment.tz.guess();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.urlencoded({
    extended: true
  })
);
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

app.use("/", require("./js"));
app.use("/milestones", require("./js/milestones"));
app.use("/feedback", require("./js/feedback"));
app.use("/api", require("./js/api"));
app.use("/sitemap", require("./js/sitemap"));

if (process.env.DEBUG) {
  app.use("/test", require("./js/test"));
  app.use("/search", require("./js/search"));
  app.use("/logs", require("./js/logs"));
  app.use("/widgets", require("./js/widgets"));
}

app.use((req, res, next) => {
  res.redirect("/");
  next();
});

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log("Listening on port: " + port);
});

module.exports = server.address();
