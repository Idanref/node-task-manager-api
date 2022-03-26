const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  // returns a promise
  sgMail.send({
    to: email,
    from: 'idanref@gmail.com',
    subject: 'Thanks For Joining In!',
    text: `Hey ${name},\nWelcome to the app!\nPlease let us know how you get along with the app.`,
    // html: ''
  });
};

const sendGoodbyeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'idanref@gmail.com',
    subject: 'Sorry To See You Go! :(',
    text: `Hey ${name},\nWe are really sorry to see you go.\nWe are happy if you let us know what you disliked about our app!\n\nBest Regards!`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendGoodbyeEmail,
};
