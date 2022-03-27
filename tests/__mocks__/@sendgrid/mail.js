module.exports = {
  // This will overwrite Sendgrid's function so emails will not be sent in the testing environment
  setApiKey() {},
  send() {},
};
