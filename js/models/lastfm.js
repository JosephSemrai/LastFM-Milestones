const request = require("request-promise");
const numeral = require("numeral");
const strings = require("../strings");
const { URL, URLSearchParams } = require("url");
const MilestoneError = require("../errors/MilestoneError");

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

  async getSongAtPosition(
    position,
    name,
    playcount,
    suggested = false,
    parse = false
  ) {
    if (!name) throw new MilestoneError(strings.nameLength.en);
    name = name.trim();
    const url = new URL(this.entryPoint);
    url.searchParams.append("method", "user.getrecenttracks");
    url.searchParams.append("user", name);
    url.searchParams.append("limit", 1);
    url.searchParams.append("page", position);
    const body = await request({
      url: url
    })
      .then(body => {
        if (!parse) return body;
        body = JSON.parse(body).recenttracks;
        const track = body.track.length > 1 ? body.track[1] : body.track[0];
        if (track.artist.image)
          track.artist.image = track.artist.image[3]["#text"];
        track.artist = track.artist["#text"];
        track.date.text = track.date["#text"];
        delete track.date["#text"];
        track.album = track.album["#text"];
        track.image = track.image[3]["#text"]
          ? track.image[3]["#text"]
          : "https://lastfm-img2.akamaized.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.png";
        const attr = body["@attr"];
        if (attr.page === attr.total)
          track.image = track.image.replace(/300/g, "1500");
        track.scrobbleNumb = attr.totalPages - attr.page;
        track.suggested = suggested;
        return track;
      })
      .catch(err => {
        err = JSON.parse(err.error);
        if (err.error && err.error === 17)
          throw new MilestoneError(
            `Your scrobbles are private; to see your milestones, please, make them public. In order to do that, visit your last.fm profile settings and untick "Hide recent listening information" on "Privacy" tab.`
          );
      });
    return body;
  }

  async getUserInfo(name) {
    if (!name) throw new MilestoneError(strings.nameLength.en);
    name = name.trim();
    const url = new URL(this.entryPoint);
    url.searchParams.append("method", "user.getinfo");
    url.searchParams.append("user", name);
    const body = await request({
      url: url
    })
      .then(body => {
        body = JSON.parse(body).user;
        body.image = body.image[3]["#text"]
          ? body.image[3]["#text"]
          : "https://lastfm-img2.akamaized.net/i/u/300x/818148bf682d429dc215c1705eb27b98.png";
        return body;
      })
      .catch(err => {
        if (err.error) {
          err = JSON.parse(err.error);
          if (err.error == 6)
            throw new MilestoneError(
              `User with username ${name} is not found!`
            );
        }
        throw new MilestoneError(strings.lastAPIDown.en);
      });
    return body;
  }

  async getUserMilestones(name, step = 10000) {
    if (!name) throw new MilestoneError(strings.nameLength.en);
    name = name.trim();
    if (step < 100) throw new MilestoneError(strings.stepErr.en);
    const milestones = await this.getUserInfo(name).then(async user => {
      if (user.playcount >= 1000000)
        throw new MilestoneError(strings.millionError.en);
      if (Math.round(user.playcount / step) > 400)
        throw new MilestoneError(strings.longProcess.en);
      const tryRequest = await this.getSongAtPosition(
        user.playcount,
        name,
        user.playcount
      );
      let tryResp = JSON.parse(tryRequest);
      tryResp = tryResp.recenttracks;
      const warning =
        user.playcount == tryResp["@attr"].totalPages
          ? null
          : `Attention! You have ${numeral(
              user.playcount - tryResp["@attr"].totalPages
            ).format()} scrobbles without date, so they are not included in the list below!`;
      user.playcount =
        user.playcount === tryResp["@attr"].totalPages
          ? user.playcount
          : tryResp["@attr"].totalPages;
      const startPoint =
        user.playcount === tryResp["@attr"].totalPages
          ? user.playcount
          : tryResp["@attr"].total;
      const endPoint = 1;
      const promises = [];
      let sugLimit = Math.floor(
        startPoint / 10 ** (step.toString().length - 1)
      );
      sugLimit = sugLimit >= 9 ? 9 : sugLimit;
      const suggestedPosition =
        startPoint -
        Math.floor(
          (getRandomInt(1, sugLimit) * 10 ** step.toString().length - 1) / 9
        );
      for (let i = startPoint; i >= endPoint; i -= step) {
        if (suggestedPosition > i && i + step > suggestedPosition)
          promises.push(
            this.getSongAtPosition(
              suggestedPosition,
              name,
              user.playcount,
              true,
              true
            )
          );
        promises.push(
          this.getSongAtPosition(i, name, user.playcount, false, true)
        );
      }
      return Promise.all(promises).then(body => {
        return {
          user: user,
          milestones: body,
          warning: warning
        };
      });
    });
    return milestones;
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = new LastFM(process.env.API_KEY);
