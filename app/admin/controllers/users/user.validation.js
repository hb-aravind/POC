import ValidationMessages from '../../../services/validation-messages';
import ValidationRules from '../../../utils/validate.rules.service';
import utils from '../../../utils';
import Enum from '../../../utils/enums';

class UserValidator extends ValidationRules {
  field;

  constructor() {
    super('user', Object.values(Enum.STATUS));
    this.field = {
      firstName: {
        in: ['body'],
        isLength: { options: { min: 1 } },
        errorMessage: ValidationMessages.getErrorMessage('firstName', 'required'),
        customSanitizer: {
          options: value => utils.strip(value),
        },
      },
      lastName: {
        in: ['body'],
        isLength: { options: { min: 1 } },
        errorMessage: ValidationMessages.getErrorMessage('lastName', 'required'),
        customSanitizer: {
          options: value => utils.strip(value),
        },
      },
      email: {
        in: ['body'],
        isLength: {
          errorMessage: ValidationMessages.getErrorMessage('email', 'required'),
          options: { min: 1 },
        },
        isEmail: {
          errorMessage: ValidationMessages.getErrorMessage('email', 'invalidEmail'),
        },
        customSanitizer: {
          options: value => utils.strip(value),
        },
      },
      mobile: {
        in: ['body'],
        optional: { checkFalsy: true },
        errorMessage: ValidationMessages.getErrorMessage('mobile', 'required'),
        trim: true,
        escape: true,
      },
      status: {
        isIn: {
          options: Object.values(Enum.STATUS),
          errorMessage: 'Invalid Value',
        },
        optional: { bodyFalsy: true },
      },
      passwordHash: {
        in: ['body'],
        optional: { bodyFalsy: true },
      },
    };
  }

  create = () => this.field;

  update = () => Object.assign({}, this.field, {
    id: {
      in: ['params'],
    },
  });
}

export default new UserValidator();
