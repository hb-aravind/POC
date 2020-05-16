import utils from '../../utils';
import Customer from '../../models/customer.model';
import BaseService from '../../services/base.service';

class CustomerService extends BaseService {
  constructor() {
    super(Customer);
  }

  login = async data => this.model.findOne(
    {
      employeeCode: data.username,
      active: true,
    },
    'id firstName lastName employeeCode fullName email passwordHash isEmailVerified',
  );

  generateCode = async () => {
    const students = await Customer.find();
    const codeVal = utils.rjust((students.length + 1).toString(), 4, '0');
    const sCode = `HB-${codeVal}`;
    return sCode;
  };

  createCustomer = async data => {
    const verificationCode = utils.GenerateCode();
    const date = new Date();
    const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    data.resetTokenExpires = tomorrowDate;
    data.resetVerificationCode = verificationCode;
    data.employeeCode = await this.generateCode();
    return this.model.create(data);
  };
}
export default new CustomerService();
