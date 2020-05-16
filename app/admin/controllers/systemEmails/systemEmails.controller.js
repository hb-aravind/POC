import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import BaseController from '../base.controller';
import ObjectService from '../../services/object.service';
import systemEmailsService from '../../services/systemEmails.service';
import utils from '../../../utils';

class SystemEmailController extends BaseController {
  constructor() {
    super('System email', ['title', 'code', 'subject', 'fromName', 'fromEmail']);
  }

  create = async req => {
    const data = matchedData(req);
    const template = await systemEmailsService.create(data);
    if (!template) {
      return this.sendResponse(httpStatus.OK, false, this.messages.INSERT_ERROR);
    }
    return this.sendResponse(httpStatus.OK, true, this.messages.INSERT_SUCCESS, template);
  };

  list = async req => {
    const doc = await systemEmailsService.list(this.listOptions(req));
    return this.sendResponse(
      httpStatus.OK,
      true,
      this.messages.LIST_SUCCESS,
      utils.getPagination(doc),
    );
  };

  update = async req => {
    const postData = matchedData(req);
    const record = await systemEmailsService.getById(req.params.id);
    if (record) {
      record.title = postData.title;
      record.subject = postData.subject;
      record.fromName = postData.fromName;
      record.fromEmail = postData.fromEmail;
      record.bcc = postData.bcc;
      record.cc = postData.cc;
      record.message = postData.message;
      record.updatedBy = req.user._id;
      const doc = await record.save();
      if (!doc) {
        return this.sendResponse(httpStatus.OK, false, this.messages.UPDATE_ERROR);
      }
      return this.sendResponse(httpStatus.OK, true, this.messages.UPDATE_SUCCESS, doc);
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.NOT_FOUND);
  };

  getById = async req => {
    const record = await systemEmailsService.getById(req.params.id);

    if (record) {
      return this.sendResponse(
        httpStatus.OK,
        true,
        this.messages.DETAILS_SUCCESS,
        ObjectService.getSystemEmailObject(record),
      );
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.NOT_FOUND);
  };
}

export default SystemEmailController;
