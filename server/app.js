const Koa = require('koa');
const serve = require('koa-static');
const logger = require('koa-logger');
const cors = require('koa-cors');
const bodyParse = require('koa-body');
const session = require('koa-session');
const debug = require('debug')('ex:server:app');
const routes = require('./routes');
const utils = require('./utils');
const config = require('./config');
const middlware = require('./middleware');

require('./db/connect');

const app = new Koa();

const { log4js, auth: authUS } = utils;
const {
  response
  // auth: authenticate
} = middlware;

const {
  port: serverPort,
  session: sessionConfig,
  uploadsAvatar
} = config.server;

debug.enabled = true;

// authUS.init();

app.use(logger());

app.use(cors({ credentials: true, origin: true }));

app.use(bodyParse({
  multipart: true,
  formidable: {
    uploadDir: uploadsAvatar.temp,
    keepExtensions: true,
    onFileBegin: () => {
    }
  }
}));

app.keys = [sessionConfig.key];
app.use(session(sessionConfig, app));

app.use(async (ctx, next) => {
  await next();
});

app.use(response());
// app.use(authenticate());

app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  log4js.responseLog(ms, ctx);
});

app.use(serve('./public'));

app.use(routes.routes());
app.use(routes.allowedMethods());

app.listen(serverPort);

app.on('error', (err, ctx) => {
  debug(err, ctx);
  log4js.errorLog(err, ctx);
});

debug(`Listening on ${serverPort}`);
