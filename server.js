const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    resave: true,
    secret: "123456",
    saveUninitialized: true
}))

app.use(require("./milestones"));

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log( "Listening on port: " + port )
});