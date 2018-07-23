const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/user/:username.jpg", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "image/svg"
  });
});

module.exports = router;
