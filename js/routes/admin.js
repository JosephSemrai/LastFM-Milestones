const express = require("express");
const Mongo = require("../log").Mongo;
const Router = express.Router();

Router.get("/logs", (req, res) => {
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  const limit = 20;
  Mongo.getFromLog(undefined, undefined, limit, offset)
    .then(result => {
      res.render("logs", {
        logs: result,
        totalPages: result.totalPages,
        page: result.page,
        totalItems: result.total,
        limit: limit,
        offset: offset
      });
    })
    .catch(err => {
      console.log(err);
      res.send(err);
    });
});

Router.get("/logs/:logId/remove", (req, res) => {
  let logId = req.params.logId;
  Mongo.removeLogEntry(logId).then(() => {
    res.redirect("/admin/logs");
  });
});

module.exports = Router;
