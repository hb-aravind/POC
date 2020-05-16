import async from 'async';
import config from '../../config';
import utils, { status } from '../../utils';
import User from '../../models/user.model';
import EmailService from '../../utils/email.service';
import BaseService from '../../services/base.service';

import Enum from '../../utils/enums';

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  getModel = () => User;

  login = async email => {
    const user = await User.findOne(
      {
        email,
      },
      [
        'firstName',
        'lastName',
        'name',
        'email',
        'mobile',
        'status',
        'role',
        'profile_pic',
        '+passwordHash',
        'resetVerificationCode',
      ],
    );
    return user;
  };

  create = async (req, user) => {
    let isMailSetPass = false;
    let password;
    const pwdToSave = user.passwordHash;
    // if user is active check for set pass or email
    if (user.status === Enum.STATUS.Active) {
      user.status = Enum.STATUS.Pending;
      if (req.body.isPasswordSet && user.passwordHash !== '') {
        password = utils.getPasswordHash(user.passwordHash);
        user.passwordHash = password;
        user.oldPasswords = [password];
      } else {
        // password = utils.getPasswordHash('Abc@123');
        isMailSetPass = true;
      }
      // user.passwordHash = password;
    } else {
      delete user.passwordHash;
    }
    // else in active status do nothing
    const users = await this.getModel().create(user);
    if (users && users.status === Enum.STATUS.Pending) {
      if (isMailSetPass) {
        const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')
          + config.setPasswordPath
          + user.resetVerificationCode}/${users._id}`;
        const variables = utils.replaceCompanyVariables(req);
        variables.push(
          {
            item: 'firstName',
            value: users.firstName,
          },
          {
            item: 'lastName',
            value: users.lastName,
          },
          {
            item: 'verificationLink',
            value: verificationLink,
          },
        );
        await EmailService(users.email, 'FORGOT_PASSWORD_ADMIN', variables);
      } else {
        const variables = utils.replaceCompanyVariables(req);
        variables.push(
          {
            item: 'firstName',
            value: users.firstName,
          },
          {
            item: 'lastName',
            value: users.lastName,
          },
          {
            item: 'email',
            value: users.email,
          },
          {
            item: 'tmpPwd',
            value: pwdToSave,
          },
        );
        await EmailService(users.email, 'USER_REGISTRATION', variables);
      }
      return user;
    }
    return users;
  };

  getByCondition = async (query, options) => User.paginate(query, options);

  changeStatus = async req => {
    const data = req.body;

    if (data.status === 'Delete') {
      const user = await this.updateStatus(data.ids, {
        deleted: true,
      });
      return user;
    }
    const Userstatus = data.status;
    if (data.status === Enum.STATUS.Active || data.status === Enum.STATUS.Inactive) {
      const users = await User.find({
        _id: {
          $in: data.ids,
        },
      }).select('+passwordHash');
      await Promise.all(
        users.map(async userDetails => {
          if (data.status === Enum.STATUS.Active && userDetails.status === Enum.STATUS.Pending) {
            data.ids.splice(userDetails._id, 1);
          } else if (data.status === Enum.STATUS.Active && !userDetails.passwordHash) {
            data.ids.splice(userDetails._id, 1);
            const tomorrowDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
            userDetails.resetTokenExpires = tomorrowDate;
            userDetails.resetVerificationCode = utils.GenerateCode();
            const verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
              config.setPasswordPath
            }${userDetails.resetVerificationCode}/${userDetails._id}`;
            const variables = utils.replaceCompanyVariables(req);
            variables.push(
              {
                item: 'firstName',
                value: userDetails.firstName,
              },
              {
                item: 'lastName',
                value: userDetails.lastName,
              },
              {
                item: 'verificationLink',
                value: verificationLink,
              },
            );
            userDetails.status = Enum.STATUS.Pending;
            await userDetails.save();
            await EmailService(userDetails.email, 'FORGOT_PASSWORD_ADMIN', variables);
          }
        }),
      );
    }

    const user = await this.updateStatus(data.ids, {
      status: Userstatus,
    });
    return user;
  };

  setPassword = async data => {
    const password = utils.getPasswordHash(data.password);
    const doc = await this.model.findOne({
      _id: data.id,
    });
    if (doc) {
      if (doc.status === Enum.STATUS.Pending) {
        doc.status = Enum.STATUS.Active;
      }

      doc.passwordHash = password;
      doc.resetVerificationCode = '';
      doc.resetTokenExpires = '';
      doc.oldPasswords = [password];
      const result = await doc.save();
      if (result) {
        return data.id;
      }
    }

    return null;
  };

  resendToken = async (req, data) => {
    const users = await User.find({
      _id: {
        $in: data.ids,
      },
    });
    if (users) {
      let count = 0;
      const date = new Date();
      const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      async.whilst(
        () => count < users.length,
        callback => {
          const user = users[count];
          const verificationCode = utils.GenerateCode();
          User.updateOne(
            {
              _id: user._id,
            },
            {
              status: Enum.STATUS.Active,
              resetTokenExpires: tomorrowDate,
              resetVerificationCode: verificationCode,
            },
            // eslint-disable-next-line consistent-return
          ).then(() => {
            count += 1;
            callback(null, count);
            let verificationLink = '';
            let code = '';
            if (user.role.toString() === Enum.ROLES.SUPER_ADMIN) {
              code = 'Resend_User_Approval';
              verificationLink = `${utils.getSiteSetting(req, 'CONTROL_PANEL_URL')}${
                config.setPasswordPath
              }${verificationCode}/${user._id}`;
            } else {
              return this.sendResponse(status.OK, false, 'Invalid use role');
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
          });
        },
        (err, n) => {
          if (err) {
            return err;
          }
          return this.sendResponse(200, true, `Successfully Approved ${n} Users.`, '');
        },
      );
    }
  };

  list = async options => {
    const selectFields = [
      'firstName',
      'lastName',
      'fullName',
      'role',
      'mobile',
      'email',
      'gender',
      'status',
      'profile_pic',
      'created',
    ];

    const AND = [
      {
        deleted: false,
        role: { $ne: Enum.ROLES.SUPER_ADMIN },
      },
    ];

    if (options.filters.length > 0) {
      options.filters.forEach(filter => {
        let Obj = {};
        if (filter.key === 'name' && filter.value) {
          AND.push({
            $or: [
              {
                fullName: new RegExp(`.*${filter.value}.*`, 'gi'),
              },
            ],
          });
        }

        if (filter.key === Enum.STATUS.Active && filter.value !== '') {
          Obj[filter.key] = filter.value;
          AND.push(Obj);
        }

        if (filter.key === 'created') {
          if (
            filter.value
            && filter.value.startDate
            && filter.value.endDate
            && filter.value.startDate !== ''
            && filter.value.endDate !== ''
          ) {
            Obj = {};
            Obj[filter.key] = {
              $gte: filter.value.startDate,
              $lte: filter.value.endDate,
            };
            AND.push(Obj);
          }
        }
      });
    }
    if (options.keyword) {
      AND.push({
        $or: [
          {
            fullName: new RegExp(`.*${options.keyword}.*`, 'gi'),
          },
          {
            email: new RegExp(`.*${options.keyword}.*`, 'gi'),
          },
          {
            mobile: new RegExp(`.*${options.keyword}.*`, 'gi'),
          },
        ],
      });
    }

    if (options.startDate && options.endDate) {
      AND.push({
        $or: [
          {
            created: {
              $gte: new Date(options.startDate),
              $lte: new Date(options.endDate),
            },
          },
        ],
      });
    }

    const results = await this.getByCondition(
      {
        $and: AND,
      },
      {
        select: selectFields,
        sort: options.sort,
        limit: options.limit,
        page: options.page,
      },
    );
    return results;
  };
}
export default new UserService();
