const express = require("express");
const numeral = require("numeral");
const Router = express.Router();

Router.get("/", (req, res) => {
  res.render("index", {
    session: req.session,
    numeral: numeral,
    error: req.error,
    success: req.success
  });
});

module.exports = Router;
