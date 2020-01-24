const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const dataRouter = require('./routes/data');
const pj = require('./package');

const app = express();
const port = process.env.PORT || 3000;

app.set('port', port);
app.set('json spaces', 2);

app.use(logger('dev'));
app.use(express.json({
  inflate: true,
  limit: '100kb',
  reviver: null,
  strict: false,
  type: 'application/json',
  verify: undefined
}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());  // to support JSON-encoded bodies

// routes:
app.use('/', indexRouter);
app.use('/data', dataRouter);

module.exports = app;

console.info(pj.name + ' (' + pj.version + ') is listening on:', app.settings.port);

