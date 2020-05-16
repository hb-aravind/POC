import { matchedData } from 'express-validator';
import config from '../../config';
import utils from '../../utils';
import Customer from '../../models/customer.model';
import EmailService from '../../utils/email.service';
import BaseService from '../../services/base.service';

class CustomerService extends BaseService {
  constructor() {
    super(Customer);
  }

  getByCondition = (query, options) => Customer.paginate(query, options);

  create = async (cust, req) => {
    const verificationCode = utils.GenerateCode();
    const date = new Date();
    const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const customer = {};
    customer.firstName = cust.firstName;
    customer.lastName = cust.lastName;
    customer.email = cust.email;
    customer.gender = cust.gender;
    customer.active = cust.active;
    customer.birthdate = cust.birthdate;
    customer.mobile = cust.mobile;
    customer.resetTokenExpires = tomorrowDate;
    customer.resetVerificationCode = verificationCode;
    customer.createdBy = req.user.id;
    customer.isEmailVerified = true;
    const custs = await Customer.create(customer);
    if (custs) {
      const verificationLink = `${utils.getSiteSetting(req, 'COMPANY_WEBSITE')
        + config.setPasswordPath
        + custs.resetVerificationCode}/${custs._id}`;
      const variables = utils.replaceCompanyVariables(req);
      variables.push(
        { item: 'firstName', value: custs.firstName },
        { item: 'lastName', value: custs.lastName },
        { item: 'verificationLink', value: verificationLink },
      );
      await EmailService(custs.email, 'CUSTOMER_SET_PASSWORD', variables);

      return custs;
    }

    return custs;
  };

  update = async (customer, req) => {
    const cust = await this.model.findById(req.params.id);
    if (cust) {
      cust.firstName = customer.firstName;
      cust.lastName = customer.lastName;
      cust.email = customer.email;
      cust.gender = customer.gender;
      cust.active = customer.active;
      cust.birthdate = customer.birthdate;
      cust.mobile = customer.mobile;
      cust.updatedBy = req.user._id;
      const updateCust = await cust.save();
      return updateCust;
    }
    return cust;
  };

  list = async options => {
    const selectFields = {
      firstName: 1,
      lastName: 1,
      email: 1,
      created: 1,
      active: 1,
    };

    const AND = [{ deleted: false }];

    if (options.keyword) {
      AND.push({
        $or: [
          { firstName: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { lastName: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { email: new RegExp(`.*${options.keyword}.*`, 'gi') },
        ],
      });
    }

    const result = await this.getByCondition(
      {
        $and: AND,
      },
      {
        select: selectFields,
        sort: options.sort,
        page: options.page,
        limit: options.limit,
      },
    );
    return result;
  };

  changeStatus = async req => {
    const data = matchedData(req);
    if (data.status === 'Delete') {
      const cust = await this.updateStatus(data.ids, { deleted: true });
      return cust;
    }
    const status = data.status === 'Active';
    const cust = await this.updateStatus(data.ids, { active: status });
    return cust;
  };
}

export default new CustomerService();
