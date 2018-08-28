require('babel-register');
var Bot = require('./src/bot').default;
const b =  new Bot(require('./config.json'));
return b.start();