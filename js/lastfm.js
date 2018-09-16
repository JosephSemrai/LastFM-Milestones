const request = require("request-promise");
const strings = require("./strings");
const { URL, URLSearchParams } = require("url");
const MilestoneError = require("./errors/MilestoneError");

class LastFM {
  constructor(apiKey, format = "json") {
    if (!apiKey) throw new Error("Invalid API key");
    this.apiKey = apiKey;
    this.format = format;
    this.entryPoint = new URL("http://ws.audioscrobbler.com/2.0/");
    this.entryPoint.search = new URLSearchParams({
      api_key: this.apiKey,
      format: this.format
    });
  }

  async getSongAtPosition(position, name) {
    if (!name) throw MilestoneError(strings.nameLength.en);
    name = name.trim();
    const url = new URL(this.entryPoint);
    url.searchParams.append("method", "user.getrecenttracks");
    url.searchParams.append("user", name);
    url.searchParams.append("limit", 1);
    url.searchParams.append("page", position);
    const body = await request({
      url: url
    }).then(body => {
      body = JSON.parse(body).recenttracks;
      const track = body.track.length > 1 ? body.track[1] : body.track[0];
      if (track.artist.image)
        track.artist.image = track.artist.image[3]["#text"];
      track.artist = track.artist["#text"];
      track.album = track.album["#text"];
      track.image = track.image[3]["#text"]
        ? track.image[3]["#text"]
        : "https://lastfm-img2.akamaized.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.png";
      track.scrobbleNumb = body["@attr"].total - body["@attr"].page;
      return track;
    });
    return body;
  }

  async getUserInfo(name) {
    if (!name) throw MilestoneError(strings.nameLength.en);
    name = name.trim();
    const url = new URL(this.entryPoint);
    url.searchParams.append("method", "user.getinfo");
    url.searchParams.append("user", name);
    const body = await request({
      url: url
    }).then(body => {
      body = JSON.parse(body).user;
      body.image = body.image[3]["#text"]
        ? body.image[3]["#text"]
        : "https://lastfm-img2.akamaized.net/i/u/300x/818148bf682d429dc215c1705eb27b98.png";
      return body;
    }).catch(err => {
        console.log(err);
        throw new MilestoneError(strings.lastAPIDown.en);
    });
    return body;
  }

  async getUserMilestones(
    name,
    step = 10000,
    includeFirst = false,
    onlyOne = false
  ) {
    if (!name) throw MilestoneError(strings.nameLength.en);
    name = name.trim();
    if (step < 100) throw new MilestoneError(strings.stepErr.en);
    const milestones = await this.getUserInfo(name).then(user => {
      if (Math.round(user.playcount / step) > 400)
        throw new MilestoneError(strings.longProcess.en);
      if (Math.floor(user.playcount / step) <= 0)
        throw new MilestoneError(strings.stepBiggerThanPlaycount.en(step));
      const startPoint = includeFirst ? user.playcount : user.playcount - step;
      const endPoint = onlyOne ? user.playcount - step : 1;
      const promises = [];
      for (let i = startPoint; i >= endPoint; i -= step)
        promises.push(this.getSongAtPosition(i, name));
      return Promise.all(promises).then(body => {
        return {
          user: user,
          milestones: body
        };
      });
    });
    return milestones;
  }
}

module.exports = new LastFM(process.env.API_KEY);
