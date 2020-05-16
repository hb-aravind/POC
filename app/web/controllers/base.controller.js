import MessageService from '../../services/message.service';

class BaseController {
  constructor(entity) {
    this.messages = new MessageService(entity);
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
}

export default BaseController;
