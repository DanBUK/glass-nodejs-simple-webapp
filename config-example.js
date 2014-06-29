var myListenHost = "0.0.0.0";
var myBaseUrl = "http://127.0.0.1:8080";

module.exports = {
  myListenHost: "0.0.0.0",
  myListenPort: 8080,
  myHostname: myBaseUrl,
  google: {
    clientId: "",
    clientSecret: "",
    redirectUrl: myBaseUrl + "/auth/google/callback"
  }
};
