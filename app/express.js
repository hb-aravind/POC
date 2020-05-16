/* eslint class-methods-use-this: "off" */

import express from 'express';
import compression from 'compression';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import httpStatus from 'http-status';

import routes from './routes';
import { log, status } from './utils';

const app = express();
const connUri = process.env.MONGO_CONN_URL;
const jwtSecret = process.env.JWT_SECRET;

class ExpressApp {
  constructor() {
    mongoose.connect(
      connUri,
      {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      err => {
        if (err) {
          err.status = status.INTERNAL_SERVER_ERROR;
          throw err;
        }
        log('Database connection successfull!');
        app.emit('ready');
      },
    );

    this.setMiddleware();
    this.helmetSecurity();
    this.setRoutes();
    this.setMongostore();
    this.setErrorHandler();
    return app;
  }

  setMiddleware() {
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use('/public', express.static(path.join(__dirname, 'public')));
    app.disable('x-powered-by');

    app.use(
      bodyParser.urlencoded({
        extended: false,
      }),
    );
    app.use(bodyParser.json());
    app.use(compression());
    app.use(cors());
  }

  helmetSecurity = () => {
    const SIX_MONTHS = 15778476000;
    app.use(helmet.hidePoweredBy());
    app.use(helmet.frameguard());
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.ieNoOpen());
    app.use(
      helmet.hsts({
        maxAge: SIX_MONTHS,
        includeSubDomains: true,
        force: true,
      }),
    );
  };

  setMongostore() {
    const Mongostore = connectMongo(session);
    app.use(
      session({
        secret: jwtSecret,
        resave: true,
        saveUninitialized: true,
        store: new Mongostore({
          mongooseConnection: mongoose.connection,
        }),
      }),
    );
  }

  setRoutes() {
    app.use('/', routes);
  }

  setErrorHandler() {
    app.use((err, req, res) => {
      const response = {
        status: err.code,
        message: err.message || httpStatus[err.code],
        success: false,
        errors: err.errors,
      };

      if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
      }

      return res
        .status(err.code)
        .json(response)
        .end();
    });
  }
}
export default new ExpressApp();
