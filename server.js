const express = require("express");
const path = require("path");
const moment = require("moment-timezone");
const cookieSession = require("cookie-session");
const passport = require("passport");
const adminAuthMiddleware = require("./js/routes/auth").adminAuthMiddleware;

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
    secret: process.env.SECRET || "defaultSecret_SHOULDBECHANGEDFORSECURITY"
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.loggedIn = req.isAuthenticated();
  res.locals.role = req.isAuthenticated() ? req.user.role : "user";
  next();
});

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

app.use("/", require("./js/routes"));
app.use("/", require("./js/routes/auth"));
app.use("/milestones", require("./js/routes/milestones"));
app.use("/feedback", require("./js/routes/feedback"));
app.use("/api", require("./js/routes/api"));
app.use("/admin", adminAuthMiddleware(), require("./js/routes/admin"));
app.use("/blog", require("./js/routes/blog"));

app.use((req, res, next) => {
  res.status(404);
  res.redirect("/");
  next();
});

app.locals.numeral = require("numeral");
app.locals.moment = require("moment");

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log("Listening on port: " + port);
});

module.exports = server.address();
