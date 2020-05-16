class ValidationRules {
  constructor(model, status) {
    this.model = model;
    this.status = status;
  }

  changeStatus = () => {
    const data = {
      ids: {
        in: ['body'],
        isLength: {
          errorMessage: `please select ${this.model} that you want to update.`,
          options: { min: 1 },
        },
        optional: { bodyFalsy: true },
      },
      'ids.*': {
        in: ['body'],
        isMongoId: {
          errorMessage: `Please provide valid unique identifier for ${this.model}.`,
        },
        optional: { bodyFalsy: true },
      },
      status: {
        in: ['body'],
        optional: { bodyfalsy: true },
        isLength: {
          errorMessage: 'status is required.',
          options: { min: 1 },
        },
        isIn: {
          options: [this.status],
          errorMessage: '',
        },
      },
    };
    return data;
  };
}
export default ValidationRules;
