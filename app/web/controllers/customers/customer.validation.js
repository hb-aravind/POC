import ValidationMessages from '../../../services/validation-messages';

class CustomerValidator {
  field;

  constructor() {
    this.field = {
      firstName: {
        in: ['body'],
        isLength: {
          options: { min: 1 },
          errorMessage: ValidationMessages.getErrorMessage(
            'firstName',
            'required',
          ),
        },
        trim: true,
        escape: true,
      },
      lastName: {
        in: ['body'],
        isLength: {
          options: { min: 1 },
          errorMessage: ValidationMessages.getErrorMessage(
            'lastName',
            'required',
          ),
        },
        trim: true,
        escape: true,
      },
      ...this.email(),
    };
  }

  email = () => ({
    email: {
      in: ['body'],
      isLength: {
        errorMessage: ValidationMessages.getErrorMessage('email', 'required'),
        options: { min: 1 },
      },
      isEmail: {
        errorMessage: ValidationMessages.getErrorMessage(
          'email',
          'invalidEmail',
        ),
      },
      trim: true,
      escape: true,
    },
  });

  identifier = type => ({
    id: {
      in: [type || 'params'],
      isMongoId: {
        errorMessage: ValidationMessages.getErrorMessage(
          'id',
          'validIdentifier',
        ),
      },
    },
  });

  password = () => ({
    password: {
      in: ['body'],
      isLength: {
        options: { min: 1 },
        errorMessage: ValidationMessages.getErrorMessage(
          'password',
          'required',
        ),
      },
      trim: true,
      escape: true,
    },
  });

  passwordConfirmation = () => ({
    passwordConfirmation: {
      in: ['body'],
      custom: {
        options: (value, { req }) => value === req.body.password,
      },
      errorMessage:
        'passwordConfirmation field must have the same value as the password field',
      trim: true,
      escape: true,
    },
  });

  login = () => ({
    username: {
      in: ['body'],
      isLength: {
        options: { min: 1 },
        errorMessage: ValidationMessages.getErrorMessage(
          'username',
          'required',
        ),
      },
      trim: true,
      escape: true,
    },
    ...this.password(),
  });

  create = () => this.field;

  signup = () => {
    const validation = Object.assign({}, this.field, {
      ...this.password(),
      ...this.passwordConfirmation(),
    });
    return validation;
  };

  update = () => {
    const validation = Object.assign({}, this.identifier(), this.field);
    return validation;
  };

  verifyEmail = () => {
    const validation = Object.assign({}, this.identifier('body'), {
      code: {
        in: ['body'],
        isLength: {
          options: { min: 1 },
          errorMessage: ValidationMessages.getErrorMessage('code', 'required'),
        },
        trim: true,
      },
    });
    return validation;
  };

  setPassword = () => {
    const validation = Object.assign(
      {},
      {
        ...this.identifier('body'),
        code: {
          in: ['body'],
          isLength: {
            options: { min: 1 },
            errorMessage: ValidationMessages.getErrorMessage(
              'code',
              'required',
            ),
          },
          trim: true,
        },
        ...this.password(),
        ...this.passwordConfirmation(),
      },
    );
    return validation;
  };
}

export default new CustomerValidator();
