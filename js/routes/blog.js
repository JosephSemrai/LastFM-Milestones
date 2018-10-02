const express = require("express");
const ObjectID = require("mongodb").ObjectID;
const adminAuthMiddleware = require("../routes/auth").adminAuthMiddleware;
const Blog = new (require("../models/blog"))();
const Router = express.Router();

Router.use((req, res, next) => {
  res.locals.reqPath = req.originalUrl;
  res.locals.role = req.isAuthenticated() ? req.user.role : "";
  next();
});

Router.get("/", (req, res) => {
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  const limit = 5;
  Blog.getPosts(limit, offset)
    .then(result => {
      res.render("blog", {
        title: "Blog",
        result: result,
        offset: offset,
        limit: limit,
        totalPages: result.totalPages
      });
    })
    .catch(err => {
      res.send(err);
    });
});

Router.get("/author/:authorName", (req, res) => {
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  const limit = 5;
  const authorName = req.params.authorName;
  Blog.getPostsByAuthor(limit, offset, authorName)
    .then(result => {
      res.render("blog", {
        title: `Posts by ${authorName}`,
        result: result,
        offset: offset,
        limit: limit,
        totalPages: result.totalPages
      });
    })
    .catch(err => {
      res.send(err);
    });
});

Router.get("/tag/:tag", (req, res) => {
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  const limit = 5;
  const tag = req.params.tag;
  Blog.getPosts(limit, offset, {
    tags: [tag]
  })
    .then(result => {
      res.render("blog", {
        title: `Posts tagged with ${tag}`,
        result: result,
        offset: offset,
        limit: limit,
        totalPages: result.totalPages
      });
    })
    .catch(err => {
      res.send(err);
    });
});

Router.get("/new-post", adminAuthMiddleware(), (req, res) => {
  res.render("new-post", {
    title: "New Blog Post"
  });
});

Router.post("/new-post", adminAuthMiddleware(), (req, res) => {
  const user = req.user.id;
  const options = req.body;
  options["user"] = {
    collection: "users",
    userId: user
  };
  options["date"] = new Date();
  Blog.addNewPost(options)
    .then(result => {
      if (result.insertedId) {
        req.session.success = "Successfully posted!";
        res.redirect("/blog");
      }
    })
    .catch(error => {
      req.session.error = error;
      res.redirect("/blog/post/new");
    });
});

Router.get("/post/:postId", (req, res) => {
  const limit = 1;
  let postId = req.params.postId;
  try {
    postId = new ObjectID(postId);
  } catch (err) {
    err = `Are you sure that there's an article with an id: ${postId}`;
    res.render("blog", {
      title: err,
      error: err
    });
  }
  Blog.getPosts(limit, undefined, {
    _id: new ObjectID(postId)
  })
    .then(result => {
      res.render("blog", {
        title: result.articles[0].title,
        result: result,
        offset: undefined,
        limit: limit,
        showFull: true,
        totalPages: result.totalPages
      });
    })
    .catch(err => {
      res.send(err);
    });
});

Router.get("/post/:postId/remove", adminAuthMiddleware(), (req, res) => {
  const postId = req.params.postId;
  const next = req.query.next;
  Blog.removePost({
    _id: new ObjectID(postId)
  })
    .then(() => {
      res.redirect(next);
    })
    .catch(err => {
      res.send(err);
    });
});

Router.get("/post/:postId/edit", adminAuthMiddleware(), (req, res) => {
  const postId = req.params.postId;
  const limit = 1;
  Blog.getPosts(limit, undefined, {
    _id: new ObjectID(postId)
  })
    .then(result => {
      res.render("new-post", {
        title: `Edit: ${result.articles[0].title}`,
        result: result.articles[0],
        edit: true
      });
    })
    .catch(err => {
      res.send(err);
    });
});

Router.post("/post/:postId/edit", adminAuthMiddleware(), (req, res) => {
  const postId = req.params.postId;
  Blog.updatePost(
    {
      _id: new ObjectID(postId)
    },
    {
      $set: req.body
    }
  ).then(() => {
    res.redirect("/blog");
  }).catch((err) => {
    console.log(err);
    res.redirect("/");
  })
});

Router.get("/post/:postId/pin", adminAuthMiddleware(), (req, res) => {
  const postId = req.params.postId;
  const showOnMain = req.query.action;
  const next = req.query.next;
  Blog.updatePost(
    {
      _id: new ObjectID(postId)
    },
    { $set: { showOnMain: showOnMain } }
  )
    .then(() => {
      res.redirect(next);
    })
    .catch(err => {
      console.log(err);
      res.redirect("/");
    });
});

module.exports = Router;
