const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/now", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "image/svg"
  });
});

router.get("/milestones", (req, res) => {
  
})

router.get("/", (req, res) => {
  res.send("works!");
})

module.exports = router;
