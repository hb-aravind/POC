/* eslint consistent-return: ["off"], prefer-destructuring: ["off"] */

import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';

import Customer from '../models/customer.model';
import User from '../models/user.model';
import utils, { status } from '../utils';
import config from '../config';
import BaseService from './base.service';

import Enum from '../utils/enums';

const jwtSecret = process.env.JWT_SECRET;

const validateJwt = expressJwt({
  secret: jwtSecret,
});
const unauthorizedError = {
  success: false,
  message: 'You are not authorized to perform this operation.',
  data: {
    code: 401,
  },
};

class AuthService extends BaseService {
  /**
   * Attach the user object to the request if authenticated
   * Otherwise returns 401
   */
  isAuthenticated = () => compose()
    .use(validateJwt)
    .use((err, req, res, next) => {
      if (err) {
        // @todo Uncomment below if next(err) is handled
        // if (err.name === 'UnauthorizedError') {
        //   const error = new Error('Missing or invalid token.');
        //   error.code = 401;
        //   next(error);
        // }

        // @todo Remove below code if above next(err) is handled
        return res.status(status.UNAUTHORIZED).json({
          success: false,
          message: 'You are not authorized to perform this operation.',
        });
      }
      next();
    })
    .use((req, res, next) => {
      let token = null;
      if (
        req.headers.authorization
          && req.headers.authorization.split(' ')[0].toLowerCase() === 'bearer'
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      Customer.findById(req.user.id)
        .select('email token active firstName lastName profile_pic dailCode mobile')
        .then(user => {
          if (!user) {
            return res.send(401);
          }
          if (user.token !== token) {
            return utils.errorWithProperty(res, 'Your token has expired.', { code: 401 }, 401);
          }

          req.user = user;
          next();
          return user;
        });
    });

  /**
   * Attach the user object to the request if user is valid
   */
  isAuthorized = () => compose()
    .use(validateJwt)
    .use((err, req, res, next) => {
      next();
    })
    .use((req, res, next) => {
      let token = null;
      if (
        req.headers.authorization
          && req.headers.authorization.split(' ')[0].toLowerCase() === 'bearer'
      ) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (req.user !== undefined) {
        Customer.findById(req.user.id)
          .select('email token active firstName lastName profile_pic dailCode mobile')
          .then(user => {
            if (user) {
              if (user.token !== token) {
                return utils.errorWithProperty(
                  res,
                  'Your token has expired.',
                  {
                    code: 401,
                  },
                  401,
                );
              }
              req.user = user;
            }
            next();
            return user;
          });
      } else {
        next();
      }
    });

  /**
   * Attach the user object to the request if user is valid and authorized
   * Otherwise returns error
   */
  checkAdminLogin = () => compose()
    .use((req, res, next) => {
      if (req.headers && !req.headers.authorization) {
        return res.status(status.UNAUTHORIZED).send(unauthorizedError);
      }
      const parts = req.headers.authorization.split(' ');
      let authorizationToken;
      if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];
        if (/^Bearer$/i.test(scheme)) {
          authorizationToken = credentials;
        } else {
          return res.status(status.UNAUTHORIZED).send(unauthorizedError);
        }
      } else {
        return res.status(status.UNAUTHORIZED).send(unauthorizedError);
      }
      jwt.verify(authorizationToken, jwtSecret, (err, token) => {
        if (
          err
            || !utils.authenticateHash(`${req.ip}${req.headers['user-agent']}${token._id}`, token.loc)
        ) {
          return res.status(status.UNAUTHORIZED).send(unauthorizedError);
        }
        req.user = token;
        next();
      });
    })
    .use((req, res, next) => {
      const AdminRoles = [Enum.ROLES.SUPER_ADMIN, Enum.ROLES.SUB_ADMIN];

      if (req.user.role && AdminRoles.indexOf(req.user.role.toString()) === -1) {
        return utils.errorWithProperty(
          res,
          'You are not authorized to access the page.',
          {
            code: 401,
          },
          401,
        );
      }
      next();
    })
    .use((req, res, next) => User.findById(
      req.user.id,
      ['firstName', 'lastName', 'email', 'role', 'profile_pic', 'active', 'mobile'],
      { lean: true },
    )
      .exec()
      .then(user => {
        if (!user) {
          return utils.errorWithProperty(
            res,
            'You do not have permission to perform this action.',
          );
        }
        user.capabilities = [];
        req.user = user;

        if (!user.role) {
          next();
          return null;
        }

        return Role.findById(user.role).then(role => {
          if (!role) {
            next();
            return null;
          }
          req.user.capabilities = role.capabilities.toObject();
          next();
          return null;
        });
      }));

  isAuthorizedGetRole = function() {
    return compose()
      .use(validateJwt)
      .use((err, req, res, next) => {
        next();
      })
      .use((req, res, next) => {
        if (req.user !== undefined) {
          User.findById(req.user.id, 'name email role active')
            .populate('role', 'slug')
            .then(user => {
              if (!user) {
                return utils.errorWithProperty(res, 'User not found.');
              }
              req.user = user;
              next();
              return user;
            })
            .catch(utils.handleError(res, next));
        } else {
          next();
        }
      });
  };

  signTokenWeb = user => jwt.sign(
    {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      receiveNotifications: user.receiveNotifications,
      profileImg:
          user.profile_pic && user.profile_pic.length > 0
            ? config.awsWebUrl + config.uploadPath.user + user.profile_pic[0]
            : '',
    },
    jwtSecret,
    {
      expiresIn: 60 * 60 * 5,
    },
  );
}

export default new AuthService();
