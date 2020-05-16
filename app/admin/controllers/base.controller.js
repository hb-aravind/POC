import { EventEmitter } from 'events';

import MessageService from '../../services/message.service';

import utils from '../../utils';
import Enum from '../../utils/enums';

class BaseController extends EventEmitter {
  constructor(entity, sortField) {
    super();
    this.messages = new MessageService(entity);
    this.sortField = sortField || [];
  }

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

  listOptions = req => {
    const options = {
      filters: req.body.filters || [],
      keyword: req.body.keyword || '',
      startDate: req.body.startDate || '',
      endDate: req.body.endDate || '',
      offset: parseInt(req.body.offset, 10) || 0,
      limit: parseInt(req.body.limit, 10) || 10,
      role: Enum.ROLES.SUPER_ADMIN,
      page: parseInt(req.body.page, 10) || 1,
    };
    options.keyword = utils.escape(options.keyword.trim());
    const sortKeys = req.body.sort ? Object.keys(req.body.sort) : [];
    let sort = {
      created: 'desc',
    };
    if (sortKeys.length && this.sortField.indexOf(sortKeys[0]) > -1) {
      sort = {};
      sort[sortKeys] = req.body.sort[sortKeys];
      options.sort = sort;
    }

    return options;
  };
}

export default BaseController;
