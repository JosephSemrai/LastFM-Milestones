const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const mongo = new (require("../models/mongo"))();
const strings = require("../strings");
const Router = express.Router();

Router.get("/signup", authMiddleware(), (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    error: req.session.error
  });
});

Router.post("/signup", authMiddleware(), (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const role = process.env.DEBUG ? "admin" : "user";

  mongo
    .createUserAccount(username, email, password, role)
    .then(result => {
      if (result) {
        req.session.success = strings.signUpSuccess.en;
        res.redirect("/login");
      } else {
        res.render("signup", {
          error: strings.signUpError.en
        });
      }
    })
    .catch(error => {
      if (error.code == 11000) {
        let field = error.errmsg.split("dup key:")[1];
        field = field.substring(field.indexOf(`"`) + 1, field.lastIndexOf(`"`));
        error = strings.alreadyExists.en(field);
      } else {
        console.log(error);
        error = strings.unknownError.en;
      }
      res.render("signup", {
        error: error
      });
    });
});

Router.get("/login", authMiddleware(), (req, res) => {
  res.render("login", {
    title: "Login",
    error: req.session.error,
    queryPath: req.query.next
  });
});

Router.post("/login", authMiddleware(), (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const next = req.query.next;

  mongo.getUser(username).then(async result => {
    const hashed = result.password;
    const equal = await bcrypt.compare(password, hashed);
    if (equal) {
      req.session.success = strings.loginSuccess.en(result.username);
      req.login({ id: result._id, role: result.role }, () =>
        res.redirect(next ? next : "/")
      );
    } else {
      error = strings.loginError.en;
      res.render("login", {
        error: error
      });
    }
  });
});

Router.get("/logout", (req, res) => {
    req.logout();
    req.session = null;
    res.redirect("/");
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

function adminAuthMiddleware() {
  return (req, res, next) => {
    if (req.isAuthenticated())
      if (req.user.role === "admin") return next();
      else {
        req.session.error = "You don't have a permission to view this page!";
        return res.redirect("/");
      }
    return res.redirect(`/login?next=${req.originalUrl}`);
  };
}

function authMiddleware() {
    return (req, res, next) => {
        if (!req.isAuthenticated()) return next();
        return res.redirect("/");
    }
}

module.exports = Router;
module.exports.adminAuthMiddleware = adminAuthMiddleware;
