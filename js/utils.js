const parameters = {
  format: "json",
  api_key: process.env.API_KEY
};

module.exports.formatParams = function formatParams(params) {
  return (
    "&" +
    Object.keys(params)
      .map(function(key) {
        return key + "=" + encodeURIComponent(params[key]);
      })
      .join("&")
  );
};

module.exports.parameters = parameters;