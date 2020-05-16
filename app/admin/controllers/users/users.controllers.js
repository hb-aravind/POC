import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import async from 'async';
import config from '../../../config';
import utils from '../../../utils';
import Enum from '../../../utils/enums';
import UserService from '../../services/user.service';
import objectService from '../../services/object.service';
import BaseController from '../base.controller';
import EmailService from '../../../utils/email.service';
import TokenService from '../../../services/token.service';

class UserController extends BaseController {
  field;

  constructor() {
    super('User', ['firstName', 'email', 'mobile', 'created', 'status']);
  }

  /**
   * @api {get} users/create create new user
   * @apiDescription Service to create new user
   * @apiName create
   * @apiGroup User
   *
   * @apiParam {String} firstName user.firstName User's first name.
   * @apiParam {String} lastName user.lastName User's last name.
   * @apiParam {String} email user.email User's email.
   * @apiParam {String} password user.password User's password.
   * @apiParam {String} role user.role User's role.
   * @apiParam {String} gender user.gender User's gender.
   * @apiUse UserObject
   */
  create = async req => {
    const user = matchedData(req);
    const verificationCode = utils.GenerateCode();
    const date = new Date();
    if (user.status !== Enum.STATUS.Inactive) {
      const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      user.resetTokenExpires = tomorrowDate;
      user.resetVerificationCode = verificationCode;
    }
    user.role = Enum.ROLES.SUB_ADMIN;
    user.fullName = `${user.firstName} ${user.lastName}`;
    user.createdBy = req.user._id;
    const doc = await UserService.create(req, user);
    this.loggerService.emit(
      'auditLog',
      utils.prepareAuditData({
        ownerId: req.user._id,
        ownerName: `${req.user.firstName} ${req.user.lastName}`,
        ownerType: req.user.role,
        event: 'created',
        collection: 'user',
        entityName: 'adminuser',
        entitytype: 'admin',
      }),
    );
    return this.sendResponse(httpStatus.OK, true, this.messages.INSERT_SUCCESS, doc);
  };

  resetDefaultPwd = async req => {
    const userId = req.params.id ? req.params.id : req.user._id;
    const user = await UserService.getModel()
      .findById(userId)
      .select('+passwordHash');
    if (user.status !== Enum.STATUS.Inactive) {
      user.passwordHash = '';
      user.status = Enum.STATUS.Pending;
      const tomorrowDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      user.resetTokenExpires = tomorrowDate;
      user.resetVerificationCode = utils.GenerateCode();
      const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
        config.setPasswordPath
      }${user.resetVerificationCode}/${user._id}`;
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
      await EmailService(user.email, 'FORGOT_PASSWORD_ADMIN', variables);
      const doc = await user.save();
      if (doc) {
        return this.sendResponse(httpStatus.OK, true, 'Password Reset Successfully.');
      }
      return this.sendResponse(httpStatus.OK, false, 'Password not yet updated, Please try again.');
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.NOT_ACTIVE);
  };

  update = async req => {
    const userId = req.params.id ? req.params.id : req.user._id;
    const data = matchedData(req);
    const user = await UserService.getModel()
      .findById(userId)
      .select('+passwordHash');
    if (user) {
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.fullName = `${data.firstName} ${data.lastName}`;
      user.email = data.email;
      user.mobile = data.mobile;
      if (
        user.status === Enum.STATUS.Inactive
        && data.status === Enum.STATUS.Active
        && user.role.toString() === Enum.ROLES.SUPER_ADMIN
        && !user.passwordHash
      ) {
        user.status = Enum.STATUS.Pending;
        const tomorrowDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
        user.resetTokenExpires = tomorrowDate;
        user.resetVerificationCode = utils.GenerateCode();
        const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
          config.setPasswordPath
        }${user.resetVerificationCode}/${user._id}`;
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
        await EmailService(user.email, 'FORGOT_PASSWORD_ADMIN', variables);
      } else if (user.status === Enum.STATUS.Pending && data.status === Enum.STATUS.Active) {
        user.status = Enum.STATUS.Pending;
      } else {
        user.status = data.status;
      }
      if (data.gender) {
        user.gender = data.gender;
      }
      user.phone = data.phone;

      await user.save();
      this.loggerService.emit(
        'auditLog',
        utils.prepareAuditData({
          ownerId: req.user._id,
          ownerName: `${req.user.firstName} ${req.user.lastName}`,
          ownerType: req.user.role,
          event: 'updated',
          collection: 'user',
          entityName: 'adminuser',
          entitytype: 'admin',
        }),
      );
      if (!req.params.id) {
        await UserService.getModel()
          .findById(userId)
          .populate({
            path: 'role',
            select: 'capabilities',
          });
      }
      return this.sendResponse(httpStatus.OK, true, this.messages.UPDATE_SUCCESS, user);
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.UPDATE_ERROR);
  };

  updateProfile = async req => {
    let tokenData = null;
    const userId = req.params.id ? req.params.id : req.user._id;
    const data = matchedData(req);
    const user = await UserService.getModel().findById(userId);
    if (user) {
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.email = data.email;
      user.mobile = data.mobile;
      if (data.gender) {
        user.gender = data.gender;
      }

      user.phone = data.phone;

      user.updatedBy = req.user._id;

      await user.save();
      if (!req.params.id) {
        await UserService.getModel()
          .findById(userId)
          .populate({
            path: 'role',
            select: 'capabilities',
          });
      }
      tokenData = await TokenService.getToken(req, user);
      return this.sendResponse(httpStatus.OK, true, this.messages.UPDATE_SUCCESS, {
        token: tokenData.token,
      });
    }

    return this.sendResponse(httpStatus.OK, false, 'User not found!');
  };

  list = async req => {
    const doc = await UserService.list(this.listOptions(req));
    doc.docs = doc.docs.map(element => objectService.getUserListObject(element));
    return this.sendResponse(200, true, this.messages.LIST_SUCCESS, utils.getPagination(doc));
  };

  /**
   * @api {get} users/:id Get User Detail
   * @apiDescription Service to get user detail
   * @apiName GetUserDetail
   * @apiGroup User
   *
   * @apiParam {String} id User's unique identifier.
   *
   * @apiUse UserObject
   */
  getById = async req => {
    const user = await UserService.getModel().findById(req.params.id);

    if (user) {
      const doc = await objectService.getUserDetailObject(user, false);
      doc.firstName = user.firstName;
      doc.lastName = user.lastName;
      return this.sendResponse(httpStatus.OK, true, this.messages.DETAILS_SUCCESS, doc);
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.NOT_FOUND);
  };

  changeStatus = async req => {
    const update = UserService.changeStatus(req);
    if (!update) {
      return this.sendResponse(httpStatus.OK, false, this.messages.STATUS_NOT_UPDATE_SUCCESS);
    }
    return this.sendResponse(httpStatus.OK, true, this.messages.STATUS_UPDATE_SUCCESS, {});
  };

  approve = async (req, res) => {
    const data = matchedData(req);
    const users = await UserService.model.find({
      _id: {
        $in: data.ids,
      },
    });
    if (users.length) {
      let count = 0;
      const date = new Date();
      const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      return async.whilst(
        () => count < users.length,
        callback => {
          const user = users[count];
          const verificationCode = utils.GenerateCode();
          user.status = Enum.STATUS.Active;
          user.resetTokenExpires = tomorrowDate;
          user.resetVerificationCode = verificationCode;
          user.save().then(() => {
            if (user.status === Enum.STATUS.Pending) {
              count += 1;
              callback(null, count);
              let verificationLink = '';
              let code = '';
              if (user.role.toString() === Enum.ROLES.SUPER_ADMIN) {
                code = 'User_Approve';
                verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
                  config.setPasswordPath
                }${verificationCode}/${user._id}`;
              } else {
                return utils.errorWithProperty(res, 'Invalid User role!');
              }
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
              EmailService(user.email, code, variables);
            }
            return utils.errorWithProperty(res, 'Invalid User!');
          });
        },
        (err, n) => {
          if (err) {
            return utils.errorWithProperty(res, 'Updation error!');
          }
          return utils.successWithProperty(res, `${n} Users successfully updated!`);
        },
      );
    }
  };

  resendToken = async req => {
    const data = matchedData(req);
    await UserService.resendToken(req, data);
    return this.sendResponse(httpStatus.OK, true, this.messages.STATUS_UPDATE_SUCCESS, {});
  };

  getCapabilities = async req => {
    const capabilities = await UserService.getUserCapabilities(req.user.role);
    if (capabilities) {
      return this.sendResponse(httpStatus.OK, true, this.messages.DETAILS_SUCCESS, capabilities);
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.ERROR, []);
  };
}

export default UserController;
