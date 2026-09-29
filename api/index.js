process.env.SERVERLESS = '1';
const { app } = require('../server/src/server');

module.exports = app;
