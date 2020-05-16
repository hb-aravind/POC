class BaseService {
  constructor(model) {
    this.model = model;
  }

  filterParams = (params, whitelist) => {
    const filtered = {};
    Object.keys(params).forEach(key => {
      if (whitelist.indexOf(key) > -1) {
        filtered[key] = params[key];
      }
    });
    return filtered;
  };

  formatApiError = err => {
    if (!err) {
      // eslint-disable-next-line no-console
      return console.error('Provide an error');
    }

    const formatted = {
      message: err.message,
    };

    if (err.errors) {
      formatted.errors = {};
      const { errors } = err;
      Object.keys(errors).forEach(type => {
        formatted.errors[type] = errors[type].message;
      });
    }

    return formatted;
  };

  /**
   * @param status status code
   * @param success boolean
   * @param message string
   * @param result response data to send
   */
  sendResponse = (status, success, message, result) => ({
    status,
    success,
    data: result,
    message,
  });

  updateStatus = (ids, status) => this.model.updateMany(
    {
      _id: { $in: ids },
    },
    status,
    { multi: true },
  );

  getById = id => this.model.findById(id);

  fieldByCondition = (condition, fields) => this.model.find(condition, fields);
}

export default BaseService;
