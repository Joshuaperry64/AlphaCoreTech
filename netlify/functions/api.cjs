const serverless = require('serverless-http');

let app;

module.exports.handler = async (event, context) => {
  if (!app) {
    const mod = await import('../../server.js');
    app = mod.default;
  }
  const handler = serverless(app);
  return handler(event, context);
};
