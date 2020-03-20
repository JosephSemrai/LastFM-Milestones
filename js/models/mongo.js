const client = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");

class Mongo {
  constructor() {
    this.databaseName = "lastmilestones";
    this.databaseUrl = process.env.MONGODB_URI;
    this.connection = client.connect(
      this.databaseUrl,
      {
        useNewUrlParser: true
      }
    );
  }

  async createUserAccount(username, email, password, role) {
    const users = "users";
    const hashedPass = await bcrypt.hash(password, 10);
    const connection = await this.connection;
    const collection = connection.db(this.databaseName).collection(users);
    const result = await collection.insertOne({
      username: username,
      email: email,
      password: hashedPass,
      role: role
    });
    return result;
  }

  async getUser(username) {
    const users = "users";
    const connection = await this.connection;
    const collection = connection.db(this.databaseName).collection(users);
    const user = await collection.findOne({
      username: username
    });
    return user;
  }
}

module.exports = Mongo;
