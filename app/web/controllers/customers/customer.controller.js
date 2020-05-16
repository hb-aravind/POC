import { matchedData } from 'express-validator';

import BaseController from '../base.controller';
import jwtService from '../../../services/jwt.service';
import utils, { status } from '../../../utils/index';
import config from '../../../config';
import customerService from '../../services/customer.service';
import emailService from '../../../utils/email.service';

class CustomerController extends BaseController {
  constructor() {
    super('User');
  }

  /**
   * @api {post} login Log In
   * @apiDescription Service to login Customer
   * @apiName CustomerLogin
   * @apiGroup Customer
   *
   * @apiParam {String} username Customer's email address.
   * @apiParam {String} password Customer's password.
   *
   * @apiUse CustomerObject
   */
  login = async req => {
    const data = matchedData(req);
    const user = await customerService.login(data);
    if (user) {
      // if (!user.isEmailVerified) {
      //   return this.sendResponse(
      //     status.OK,
      //     false,
      //     'Please verify your email address to login.',
      //     {},
      //   );
      // }
      const isAuthenticated = user.authenticate(data.password, user.passwordHash);

      if (isAuthenticated) {
        return this.sendResponse(status.OK, true, 'Loggged in successfully.', {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          token: jwtService.createJwtToken(
            {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              employeeCode: user.employeeCode,
            },
            { expiresIn: 60 * 60 * 5 },
          ),
        });
      }
    }
    return this.sendResponse(status.OK, false, 'Invalid username or password', {});
  };

  /**
   * @api {post} customers/signup Sign Up
   * @apiDescription Service to register Customer
   * @apiName CustomerRegister
   * @apiGroup Customer
   *
   * @apiParam {String} firstName Customer's first name.
   * @apiParam {String} lastName Customer's last name.
   * @apiParam {String} email Customer's email.
   * @apiParam {String} password Customer's password.
   * @apiParam {String} passwordConfirmation Password confirmation to recheck the password.
   *
   * @apiSuccess {String} id Unique identifier of user.
   *
   */
  create = async req => {
    const data = matchedData(req);
    data.active = true;
    const customer = await customerService.createCustomer(data);
    if (customer.email) {
      const verificationLink = `${utils.getSiteSetting(req, 'COMPANY_WEBSITE')}${
        config.customerVerificationPath
      }${customer.resetVerificationCode}/${customer._id}`;
      const variables = utils.replaceCompanyVariables(req);
      variables.push(
        { item: 'firstName', value: customer.firstName },
        { item: 'lastName', value: customer.lastName },
        { item: 'verificationLink', value: verificationLink },
      );
      // emailService(customer.email, 'CUSTOMER_REGISTRATION', variables);
      return this.sendResponse(
        status.OK,
        true,
        'Registration completed successfully.Please check your email.',
        {
          id: customer._id,
          employeeCode: customer.employeeCode,
        },
      );
    }
    return this.sendResponse(
      status.OK,
      false,
      'Error occurred during signup.Please try agian later!',
    );
  };

  /**
   * @api {put} customers/:id Customer Update
   * @apiDescription Service to update customer detail
   * @apiName CustomerUpdate
   * @apiGroup Customer
   *
   * @apiParam {String} id Customer's unique identifier.
   *
   */
  update = async req => {
    const data = matchedData(req);
    const customer = await customerService.model.findById(req.params.id);

    if (customer) {
      customer.firstName = data.firstName;
      customer.lastName = data.lastName;
      customer.email = data.email;
      await customer.save();
      return this.sendResponse(status.OK, false, 'Customer detail updated successfully.');
    }
    return this.sendResponse(status.OK, false, 'Error occured while updating customer detail.');
  };

  /**
   * @api {post} customers/verify-email Verify Email
   * @apiDescription Service to Verify customer email
   * @apiName VerifyEmail
   * @apiGroup Customer
   *
   *
   * @apiParam {String} id Customer's unique identifier.
   * @apiParam {String} code Customer's verification code.
   *
   */
  verifyEmail = async req => {
    const data = matchedData(req);
    const customer = await customerService.model.findOne({
      _id: data.id,
      resetVerificationCode: data.code,
    });
    if (customer) {
      const expiryDate = new Date(customer.resetTokenExpires).getTime();
      const current = new Date().getTime();
      if (expiryDate > current) {
        customer.isEmailVerified = true;
        customer.resetVerificationCode = '';
        customer.resetTokenExpires = '';
        await customer.save();
        return this.sendResponse(status.OK, false, 'Email successfully verified.');
      }
    }
    return this.sendResponse(
      status.OK,
      false,
      'Your link is expired please contact administrator.',
    );
  };

  /**
   * @api {post} customers/forgot-password Forgot Password
   * @apiDescription Service to recover forgot password
   * @apiName CustomerForgotPassword
   * @apiGroup Customer
   *
   *
   * @apiParam {String} email Customer's email address.
   *
   */
  forgotPassword = async req => {
    const data = matchedData(req);

    const user = await customerService.model.findOne(
      {
        email: data.email,
      },
      'firstName lastName email',
    );

    if (user) {
      const date = new Date();
      const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      user.resetVerificationCode = utils.GenerateCode();
      user.resetTokenExpires = tomorrowDate;
      await user.save();

      const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
        config.setPasswordPath
      }${user.resetVerificationCode}/${user._id}`;
      const variables = utils.replaceCompanyVariables(req);
      variables.push(
        { item: 'firstName', value: user.firstName },
        { item: 'lastName', value: user.lastName },
        { item: 'verificationLink', value: verificationLink },
      );
      emailService(user.email, 'CUSTOMER_FORGOT_PASSWORD', variables);
      return this.sendResponse(
        status.OK,
        true,
        'Email has been sent to your registered email address to reset password.',
      );
    }
    return this.sendResponse(
      status.OK,
      false,
      "We couldn't find your account with that information",
    );
  };

  /**
   * @api {post} set-password Set User password
   * @apiDescription Service to set customer password
   * @apiName CustomerSetPassword
   * @apiGroup Customer
   *
   * @apiParam {String} id Customer unique identifier.
   * @apiParam {String} code Verification code to update password.
   * @apiParam {String} password New password.
   * @apiParam {String} passwordConfirmation Password confirmation.
   */
  setPassword = async req => {
    const data = matchedData(req);
    const user = await customerService.model.findOne(
      {
        _id: data.id,
        resetVerificationCode: data.code,
      },
      'email resetTokenExpires',
    );

    if (user) {
      const expiryDate = new Date(user.resetTokenExpires).getTime();
      const current = new Date().getTime();
      if (expiryDate > current) {
        user.passwordHash = utils.getPasswordHash(data.password);
        user.resetVerificationCode = '';
        user.resetTokenExpires = '';
        await user.save();
        return this.sendResponse(status.OK, true, 'Password updated successfully.');
      }
      return this.sendResponse(
        status.OK,
        false,
        'Reset password link is expired please contact administrator.',
      );
    }
    return this.sendResponse(
      status.OK,
      false,
      'Reset password link is expired please contact administrator.',
    );
  };
}
export default CustomerController;
