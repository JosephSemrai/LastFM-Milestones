const URL = require("url").URL;
const request = require("request-promise");
const strings = require("./strings");
const Mongo = require("./models/mongo");
const ObjectID = require("mongodb").ObjectID;

class MongoDbLog extends Mongo {
  constructor() {
    super();
    this.collectionName = process.env.DEBUG ? "requests-demo" : "requests";
  }

  async writeToLog(options) {
    const connection = await this.connection;
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    collection.insertOne(options);
  }

  async getFromLog(project, projection, numberLimit, offset) {
    const connection = await this.connection;
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const cursor = collection.find(projection ? projection : {});
    const total = await cursor.count();
    if (project) cursor.project(project);
    if (numberLimit) cursor.limit(numberLimit);
    if (offset != undefined) cursor.skip(offset);
    else offset = 0;
    cursor.sort({ date: -1 });
    const log = await cursor.toArray();
    return {
      total: total,
      totalPages: Math.ceil(total / numberLimit),
      page: Math.ceil(offset / numberLimit) + 1,
      log: log
    };
  }

  async removeLogEntry(id) {
    const connection = await this.connection;
    const collection = connection
      .db(this.databaseName)
      .collection(this.collectionName);
    const promise = collection.deleteOne({"_id": new ObjectID(id)});
    return promise;
  }
}

class Telegram {
  constructor() {
    this.apiKey = process.env.BOT_KEY;
    this.entryPoint = new URL("https://api.telegram.org/");
    this.botUrl = new URL(`${this.entryPoint}bot${this.apiKey}`);
  }

  async sendMessage(text, chatId, parseMode = "html") {
    const url = `${this.botUrl}/sendMessage`;
    const sendMessage = await request({
      url: url,
      form: {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      },
      method: "POST"
    });
    return sendMessage;
  }

  sendSearchAlert(options) {
    const message = strings.telegramAlertMessage(
      options.name,
      options.step,
      options.isSuggested,
      options.error
    );
    const chatId = process.env.NEW_SEARCH_CHAT_ID;
    this.sendMessage(message, chatId).then(body => {
      body = JSON.parse(body);
      console.log(body.ok ? "Log posted" : "Failed to post the log!");
    });
  }
}

module.exports.Mongo = new MongoDbLog();
module.exports.Telegram = new Telegram();
