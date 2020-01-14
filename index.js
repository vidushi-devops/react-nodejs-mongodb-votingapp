const express = require('express');

// MongoDB Modules
const { MongoClient } = require('mongodb');
const assert = require('assert');

// View Modules
const register = require('@react-ssr/express/register');

// App lifecycle handlers
const onTerminationSignal = require('death');

// Logging Modules
const httpLogger = require('morgan');

const log = require('./utils/consoleMessage');

// Endpoints Modules
const viewsRouter = require('./routes/views');
const voterRouter = require('./routes/voter');
const voteRouter = require('./routes/vote');

const setCandidates = require('./mongodb/setCandidates');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(httpLogger('dev'));
app.use(express.static('public'));

log('info', 'Connecting application with MongoDB...');
MongoClient.connect('mongodb://localhost:27017/utn-dw-votacion', { useUnifiedTopology: true }, (err, mongodb) => {
  assert.equal(null, err);
  const db = mongodb.db('election');
  setCandidates(db);
  log('info', 'Connection established');

  (async () => {
    log('info', 'Setting routes and view template...');
    // register `.jsx` or `.tsx` as a view template engine
    await register(app);

    app.use('/', viewsRouter);

    app.use('/voter', (req, res, next) => {
      req.database = db;
      next();
    }, voterRouter);

    app.use('/vote', (req, res, next) => {
      req.database = db;
      next();
    }, voteRouter);
    log('info', 'Done.');

    app.listen(3000, () => {
      log('header', 'RUNNING APPLICATION ON PORT 3000', true);
      log('info', 'View Logic Handler: React');
      log('info', 'View Styles Handler: Emotion');
      log('info', 'View Template Engine: JSX');
      log('info', 'Database: MongoDB');
      log('info', 'HTTP Requests Logs: Morgan');
      log('info', 'App Logs: Chalk');
      log('header', 'ENDPOINTS', true);
      log('info', 'GET  | /');
      log('info', 'GET  | /voter');
      log('info', 'POST | /vote');
    });
  })();

  onTerminationSignal(() => {
    log('info', 'Closing database connection', true);
    mongodb.close();
    log('info', 'Closed');
    log('info', 'Exiting process...');
    process.exit();
  });
});
