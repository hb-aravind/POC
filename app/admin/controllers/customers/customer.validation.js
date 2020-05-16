import ValidationMessages from '../../../services/validation-messages';
import utils from '../../../utils';

class CustomerValidator {
  field;

  constructor() {
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
      },
      gender: {
        in: ['body'],
        optional: { checkFalsy: true },
      },
      birthdate: {
        in: ['body'],
        optional: { bodyFalsy: true },
        toDate: true,
        errorMessage: ValidationMessages.getErrorMessage('birthdate', 'required'),
      },
      active: {
        isIn: {
          options: [[true, false]],
          errorMessage: 'Invalid Value',
        },
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

export default new CustomerValidator();
