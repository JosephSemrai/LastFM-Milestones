const Mongo = require("./mongo");
const ObjectID = require("mongodb").ObjectID;

class Blog extends Mongo {
  constructor() {
    super();
    this.collectionName = process.env.DEBUG ? "posts-demo" : "posts";
  }

  async addNewPost(options) {
    const connection = await this.connect();
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const promise = await collection.insertOne(options);
    connection.close();
    return promise;
  }

  async getPosts(numberLimit, offset, query) {
    const connection = await this.connect();
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const cursor = collection.find(query ? query : {});
    const total = await cursor.count();
    if (offset != undefined) cursor.skip(offset);
    if (numberLimit != undefined) cursor.limit(numberLimit);
    else offset = 0;
    cursor.sort({ date: -1 });
    const articles = await cursor.toArray();
    for (let article of articles) {
      const user = await connection
        .db(this.databaseName)
        .collection(article.user.collection)
        .find({ _id: new ObjectID(article.user.userId) })
        .project({ _id: 1, username: 1 })
        .limit(1)
        .toArray();
      article.user = user[0];
    }
    connection.close();
    return {
      total: total,
      totalPages: Math.ceil(total / numberLimit),
      page: Math.ceil(offset / numberLimit) + 1,
      articles: articles
    };
  }

  async getPostsByAuthor(numberLimit, offset, author) {
    const connection = await this.connect();
    const collection = connection.db(this.databaseName).collection("users");
    const authorUser = await collection
      .find({ username: author })
      .limit(1)
      .project({ _id: 1, username: 1 })
      .toArray();
    const authorId = authorUser[0]._id;
    const posts = await this.getPosts(numberLimit, offset, {
      "user.userId": `${authorId}`
    });
    connection.close();
    return posts;
  }

  async removePost(query) {
    const connection = await this.connect();
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const promise = await collection.deleteOne(query);
    connection.close();
    return promise;
  }

  async updatePost(query, updateObj) {
    const connection = await this.connect();
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const promise = await collection.updateOne(query, updateObj);
    connection.close();
    return promise;
  }

  async getLatestPinnedPost() {
    const result = await this.getPosts(1, undefined, {
      $or: [{ showOnMain: "true" }, { showOnMain: "on" }]
    });
    return result;
  }
}

module.exports = Blog;
