var myBaseHost = "http://127.0.0.1:8080";

module.exports = {
  myHostname: myBaseHost,
  google: {
    clientId: "",
    clientSecret: "",
    redirectUrl: myBaseHost + "/auth/google/callback"
  }
};
