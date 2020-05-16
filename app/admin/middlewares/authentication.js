import jwt from 'jsonwebtoken';

import User from '../../models/user.model';
import { status } from '../../utils';

import Enum from '../../utils/enums';
import config from '../../config';

const jwtSecret = process.env.JWT_SECRET;

const unauthorizedError = {
  success: false,
  message: 'You are not authorized to perform this operation.',
  data: {
    code: 401,
  },
};

class AuthService {
  authenticate = (req, res, next) => {
    if (config.whiteListAPIs && config.whiteListAPIs.indexOf(req.baseUrl + req.path) > -1) {
      return next();
    }
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
        jwt.verify(authorizationToken, jwtSecret, (err, token) => {
          if (
            err
            // || !utils.authenticateHash(`${req.ip}${req.headers['user-agent']}${token._id}`, token.loc)
          ) {
            return res.status(status.UNAUTHORIZED).send(unauthorizedError);
          }
          req.user = token;
          return this.authorize(req, res, next);
        });
      } else {
        return res.status(status.UNAUTHORIZED).send(unauthorizedError);
      }
    } else {
      return res.status(status.UNAUTHORIZED).send(unauthorizedError);
    }
  };

  validateUser = async (req, res, next) => {
    // if (req.user && req.user.role && req.user.role !== Enum.ROLES.Field_Technician) {
    const user = await User.findOne(
      { _id: req.user.id, role: req.user.role },
      ['email', 'token', 'active', 'firstName', 'lastName', 'profile_pic', 'mobile', 'role'],
      { lean: true },
    );
    if (user) {
      req.user = user;
      return next();
    }
    return res.status(status.UNAUTHORIZED).send(unauthorizedError);
  };
  // return res.status(status.UNAUTHORIZED).send(unauthorizedError);
  // };

  authorize = (req, res, next) => this.validateUser(req, res, next)
    // If role from exact match is not found then check by regex for GET and PUT request.
  ;
}
export default new AuthService();
