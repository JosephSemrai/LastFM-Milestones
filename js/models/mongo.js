const client = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");

class Mongo {
  constructor() {
    this.databaseName = "lastmilestones";
    this.databaseUrl = process.env.MONGODB;
  }

  async connect() {
    const connection = await client.connect(
      this.databaseUrl,
      {
        useNewUrlParser: true
      }
    );
    return connection;
  }

  async createUserAccount(username, email, password, role) {
    const users = "users";
    const hashedPass = await bcrypt.hash(password, 10);
    const connection = await this.connect();
    const collection = connection.db(this.databaseName).collection(users);
    const result = await collection.insertOne({
        username: username,
        email: email,
        password: hashedPass,
        role: role
    })
    connection.close();
    return result;
  }

  async getUser(username) {
    const users = "users";
    const connection = await this.connect();
    const collection = connection.db(this.databaseName).collection(users);
    const user = await collection.findOne({
      "username": username
    });
    connection.close();
    return user;
  }
}

module.exports = Mongo;
