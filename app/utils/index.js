import bcrypt from 'bcrypt';
import striptags from 'striptags';
import url from 'url';
import moment from 'moment';
import httpStatus from 'http-status';
import Debug from 'debug';
import { validationResult } from 'express-validator';
import config from '../config';

const saltRounds = 10;

class Utils {
  errorFormatterFun = error => ({
    param: error.param,
    message: error.msg,
  });

  escape = str => str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');

  unescape = str => str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x5C;/g, '\\')
    .replace(/&#96;/g, '`');

  getAge = date => {
    if (date) {
      const birthdate = moment(date, 'YYYY-MM-DD');
      return moment().diff(birthdate, 'years');
    }
    return 0;
  };

  customResponse = (res, response, statusCode) => res
    .status(statusCode || 200)
    .send(response)
    .end();

  successWithProperty = (res, message, response, statusCode) => res
    .status(statusCode || 200)
    .send(
      Object.assign(
        {
          message: message || 'Success',
          success: true,
          data: null,
        },
        response,
      ),
    )
    .end();

  errorWithProperty = (res, message, response, statusCode) => res
    .status(statusCode || 200)
    .send(
      Object.assign(
        {
          message: message || 'Error',
          success: false,
          data: null,
        },
        response,
      ),
    )
    .end();

  getValidationResult = (req, res) => new Promise(resolve => {
    try {
      validationResult(req).throw();
      return resolve(true);
    } catch (err) {
      err.formatWith(this.errorFormatterFun);
      const error = err.mapped({ onlyFirstError: true });
      return this.errorWithProperty(res, error[Object.keys(error)[0]].message, {
        errors: error,
      });
    }
  });

  replaceCompanyVariables = req => [
    { logo: this.unescape(`${req.app.get('COMPANY_WEBSITE')}${config.logo}`) },
    { company_name: this.getSiteSetting(req, 'COMPANY_NAME') },
    { site_url: this.getSiteSetting(req, 'COMPANY_WEBSITE') },
  ];

  strip = data => striptags(data).trim();

  getEmailContent = (html, variables) => ({
    company_name: this.unescape(variables[0].company_name),
    content: html,
    logo: variables[0].logo,
    site_url: variables[0].site_url,
    copyright_text: variables[0].copyright_text,
    facebook_logo: variables[0].facebook_logo,
    twitter_logo: variables[0].twitter_logo,
  });

  formatNumber = number => number.toFixed(2);

  getDateInFormat = (date, format, fromFormat) => {
    let day = moment(date);
    if (fromFormat) {
      day = moment(date, fromFormat);
    }
    return day.format(format || 'YYYY-MM-DD HH:mm:ss');
  };

  getPagination = entity => {
    if (entity.docs) {
      return {
        docs: entity.docs,
        total: parseInt(entity.totalDocs, 10),
        page: entity.page,
        next: entity.hasNextPage,
        nextPage: entity.nextPage !== null ? entity.nextPage : 0,
      };
    }
    return {
      docs: [],
      total: 0,
      page: 0,
      offset: 0,
      next: false,
    };
  };

  respondResultWithPaging = () => entity => {
    let data = null;
    if (entity.docs) {
      const offset = parseInt(entity.offset, 10) + entity.limit;
      data = {
        docs: entity.docs,
        total: parseInt(entity.total, 10),
        page: parseInt(parseInt(entity.offset, 10) / parseInt(entity.limit, 10), 10),
        offset: offset < entity.total ? offset : -1,
        next: offset < entity.total,
      };
      return {
        success: true,
        data,
        message: false,
      };
    }
    data = {
      docs: [],
      total: 0,
      page: 0,
      next: false,
    };
    return {
      success: true,
      data,
      message: 'Data not found!',
    };
  };

  rjust = (string, width, padding) => {
    padding = padding || ' ';
    padding = padding.substr(0, 1);
    if (string.length < width) {
      return padding.repeat(width - string.length) + string;
    }
    return string;
  };

  getPasswordHash = password => bcrypt.hashSync(password, saltRounds);

  authenticateHash = (data, dataToMatch) => bcrypt.compareSync(data, dataToMatch);

  handleEntityNotFound = (res, entity) => res
    .status(200)
    .json({
      success: true,
      data: [],
      message: entity ? `${entity} not found!` : 'Record not found!',
    })
    .end();

  handleError = (res, err) => {
    let errors = '';
    if (err.errors) {
      errors = err.errors[Object.keys(err.errors)[0]].message;
    }
    if (!errors && err.message !== '') {
      errors = err.message;
    }

    /* eslint no-console: ["off"] */
    console.error(`Error ===> ${errors}`);
    return this.errorWithProperty(res, errors);
  };

  generateSlug = item => item
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  sanitizeUniqueName = item => item
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  getImageName = name => name
    .toLowerCase()
    .replace(/[^a-z0-9.-_\s]/g, '')
    .replace(/\s+/g, '-');

  getFileExtension = name => {
    const names = name.split('.');
    return `.${names[names.length - 1]}`;
  };

  getSiteSetting = (req, key) => {
    const value = req.app.get(key);
    if (value) {
      return value;
    }
    return '';
  };

  GenerateCode = () => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 50; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  fullUrl = req => url.format({
    protocol: req.protocol,
    host: req.get('host'),
  });

  checkFileSizeInMB = (size, sizeInMB) => {
    if (size < 1024 * 1024 * sizeInMB) {
      return true;
    }
    const error = new Error('The file size exceeds the limit allowed and cannot be saved');
    error.code = httpStatus.REQUEST_ENTITY_TOO_LARGE;
    throw error;
  };

  prepareAuditData = ({
    ownerId,
    ownerName,
    ownerType,
    event,
    collection,
    entityId,
    entityName,
    entitytype,
  }) => {
    const audit = {
      owner: {
        id: ownerId,
        name: ownerName,
        type: ownerType,
      },
      event,
      table: collection,
      entity: {
        id: entityId,
        name: entityName,
        type: entitytype,
      },
      level: 'Hippa',
    };
    return audit;
  };
}
export default new Utils();

export const log = Debug('express:api');

export const status = httpStatus;
