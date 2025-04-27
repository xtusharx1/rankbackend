// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./defence-boarding-schools-firebase-adminsdk-dxkqq-0aa87f8454.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;