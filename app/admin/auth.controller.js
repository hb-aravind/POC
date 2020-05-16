import { matchedData } from 'express-validator';
import config from '../config';
import TokenService from '../services/token.service';

import utils, { status } from '../utils';
import User from '../models/user.model';

import userService from './services/user.service';
import EmailService from '../utils/email.service';
import BaseController from './controllers/base.controller';
import Enum from '../utils/enums';

class AuthController extends BaseController {
  constructor() {
    super('User');
  }

  /**
   * @api {post} users/login Log In
   * @apiDescription Service to login user
   * @apiName UserLogin
   * @apiGroup User
   *
   *
   * @apiParam {String} username User's email address.
   * @apiParam {String} password User's password.
   *
   * @apiUse UserObject
   */
  login = async req => {
    let tokenData = null;
    const data = matchedData(req);
    const user = await userService.login(data.email);
    if (user) {
      if (user.status === 'Pending' && user.role && user.role._id === Enum.ROLES.ADMIN_ROLE) {
        if (data.password && user.passwordHash) {
          if (user.authenticate(data.password, user.passwordHash)) {
            return this.sendResponse(
              status.OK,
              true,
              'Temporary password verified successfully. Please set your password.',
              {
                user,
              },
            );
          }
        }
      } else if (user.status !== 'Active') {
        return this.sendResponse(status.OK, false, this.messages.NOT_ACTIVE);
      } else if (data.password && user.passwordHash) {
        if (user.authenticate(data.password, user.passwordHash)) {
          tokenData = await TokenService.getToken(req, user);
          return this.sendResponse(status.OK, true, this.messages.LOGGED_IN_SUCCESS, {
            token: tokenData.token,
          });
        }
      }
    }
    return this.sendResponse(status.NOT_FOUND, false, this.messages.INVALID_LOGIN, {});
  };

  forgotPassword = async req => {
    const data = matchedData(req);
    const verificationCode = utils.GenerateCode();
    const date = new Date();
    const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const result = await User.findOneAndUpdate(
      {
        email: data.email,
      },
      {
        resetVerificationCode: verificationCode,
        resetTokenExpires: tomorrowDate,
      },
      {
        New: true,
      },
    );

    if (result) {
      const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')
        + config.setPasswordPath
        + verificationCode}/${result._id}`;
      const variables = utils.replaceCompanyVariables(req);
      variables.push(
        {
          item: 'firstName',
          value: result.firstName,
        },
        {
          item: 'lastName',
          value: result.lastName,
        },
        {
          item: 'verificationLink',
          value: verificationLink,
        },
      );
      await EmailService(result.email, 'FORGOT_PASSWORD_ADMIN', variables);
      return this.sendResponse(
        status.OK,
        true,
        'Email has been sent to your registered email address to set password.',
        verificationCode,
      );
    }
    return this.sendResponse(status.OK, false, 'Email not found!');
  };

  verifyToken = async req => {
    const data = matchedData(req);
    const where = {
      _id: data.id,
      resetVerificationCode: data.code,
      status: {
        $in: ['Active', 'Pending'],
      },
    };
    const user = await User.findOne(where);

    if (user) {
      const myDate = new Date(user.resetTokenExpires);
      if (myDate > new Date()) {
        if (data.changePass) {
          return this.sendResponse(status.OK, true, '', []);
        }
        const users = await user.save();
        return this.sendResponse(status.OK, true, '', users.toJSON());
      }
      const verificationCode = utils.GenerateCode();
      user.resetVerificationCode = verificationCode;
      await user.save();
      const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')
        + config.setPasswordPath
        + verificationCode}/${user._id}`;
      const variables = utils.replaceCompanyVariables(req);
      variables.push(
        {
          item: 'firstName',
          value: user.firstName,
        },
        {
          item: 'lastName',
          value: user.lastName,
        },
        {
          item: 'verificationLink',
          value: verificationLink,
        },
      );
      EmailService(user.email, 'Forgot_Password_Email', variables);
      return this.sendResponse(
        status.OK,
        true,
        'Verification token is expired, the refresh token is sent to your registered email. Please check mail and try again.',
        user.toJSON(),
      );
    }
    return this.sendResponse(
      status.OK,
      false,
      'Verification token is not valid, please retry forgot password!',
      [],
    );
  };

  changePassword = async req => {
    const data = req.body;

    const user = await User.findOne(
      {
        _id: data.id,
      },
      [
        'firstName',
        'lastName',
        'name',
        'email',
        'mobile',
        'role',
        'profile_pic',
        'passwordHash',
        '+salt',
        'oldPasswords',
      ],
    );

    if (!user) {
      return this.sendResponse(status.UNAUTHORIZED, false, 'User not found!');
    }
    if (!user.authenticate(req.body.oldPassword, user.passwordHash)) {
      return this.sendResponse(status.OK, false, 'Your old password does not match');
    }

    const newPassword = utils.getPasswordHash(data.newPassword);
    let matchPassword = false;
    user.oldPasswords.forEach(lastThreePassword => {
      if (!matchPassword) {
        matchPassword = user.authenticate(data.newPassword, lastThreePassword);
      }
    });
    if (matchPassword) {
      return this.sendResponse(
        status.OK,
        false,
        'You can not set your last three passwords as a new password.',
      );
    }
    if (user.oldPasswords.length < 3) {
      user.oldPasswords.push(newPassword);
    } else {
      user.oldPasswords.splice(0, 1);
      user.oldPasswords.push(newPassword);
    }
    user.passwordHash = newPassword;
    await user.save();
    return this.sendResponse(status.OK, true, 'Password reset successfully', {});
  };

  verifyApproveToken = async req => {
    const data = matchedData(req);
    const user = await userService.model.findOne({
      _id: data.id,
      resetVerificationCode: data.code,
    });
    if (user) {
      const myDate = new Date(user.resetTokenExpires);
      if (myDate.getMilliseconds() > new Date().getMilliseconds()) {
        return this.sendResponse(status.OK, true, 'User successfully verified.', []);
      }
    }
    return this.sendResponse(status.OK, false, 'Account activation link is not valid.');
  };

  setPassword = async req => {
    const data = matchedData(req);
    const user = await userService.setPassword(data);
    if (user) {
      return this.sendResponse(status.OK, true, 'Password set successfully.', {});
    }
    return this.sendResponse(status.OK, false, 'Error occured while password update.');
  };
}
export default AuthController;
