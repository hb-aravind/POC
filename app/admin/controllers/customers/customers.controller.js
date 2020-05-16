import httpStatus from 'http-status';
import { matchedData } from 'express-validator';
import utils from '../../../utils';
import customerService from '../../services/customers.service';
import objectService from '../../services/object.service';
import BaseController from '../base.controller';

class CustomerController extends BaseController {
  constructor() {
    super('Customer', ['firstName', 'lastName', 'email', 'created']);
  }

  /**
   * @api {post} /customer Create
   * @apiDescription Service to create customer
   * @apiName CreateCustomer
   * @apiGroup Customer
   *
   * @apiUse multipartHeader
   *
   * @apiUse authHeader
   * @apiUse CustomerObject
   */
  create = async req => {
    const customer = matchedData(req);
    const doc = await customerService.create(customer, req);
    if (!doc) {
      return this.sendResponse(httpStatus.OK, false, this.messages.INSERT_ERROR);
    }
    return this.sendResponse(httpStatus.OK, true, this.messages.INSERT_SUCCESS, {});
  };

  /**
   * @api {put} /customer/:id Update
   * @apiDescription Service to update customer
   * @apiName UpdateCustomer
   * @apiGroup Customer
   * @apiUse multipartHeader
   * @apiUse authHeader
   * @apiUse CustomerObject
   * @apiParam {String} id Unique identifier of customer.
   *
   */
  update = async req => {
    const customer = matchedData(req);
    const doc = await customerService.update(customer, req);
    if (!doc) {
      return this.sendResponse(httpStatus.OK, false, this.messages.UPDATE_ERROR);
    }
    return this.sendResponse(httpStatus.OK, true, this.messages.UPDATE_SUCCESS, {});
  };

  /**
   * @api {post} /customer/list List all
   * @apiName ListCustomer
   * @apiDescription Searvice to list all customer
   * @apiGroup Customer
   * @apiUse authHeader
   * @apiUse pagingResponse
   * @apiUse CustomerListDetail
   */
  list = async req => {
    const doc = await customerService.list(this.listOptions(req));
    doc.docs = doc.docs.map(element => objectService.getCustomerListObject(element.toJSON()));
    return this.sendResponse(
      httpStatus.Ok,
      true,
      this.messages.LIST_SUCCESS,
      utils.getPagination(doc),
    );
  };

  changeStatus = async req => {
    const update = customerService.changeStatus(req);
    if (!update) {
      return this.sendResponse(httpStatus.OK, false, this.messages.STATUS_NOT_UPDATE_SUCCESS);
    }
    return this.sendResponse(httpStatus.OK, true, this.messages.STATUS_UPDATE_SUCCESS, {});
  };

  /**
   * @api {get} /customer/:id Get Detail
   * @apiName GetCustomerDetail
   * @apiDescription Service to get customer detail based on unique identifier
   * @apiGroup Customer
   * @apiUse authHeader
   * @apiParam {String} id Unique identifier for customer.
   * @apiUse CustomerObject
   */
  getById = async req => {
    const cust = await customerService.model.findById(req.params.id);
    if (cust) {
      const doc = objectService.getCustomerDetailObject(cust.toJSON());
      doc.firstName = cust.firstName;
      doc.lastName = cust.lastName;
      return this.sendResponse(httpStatus.OK, true, this.messages.DETAILS_SUCCESS, doc);
    }
    return this.sendResponse(httpStatus.OK, false, this.messages.NOT_FOUND);
  };

  /**
   * @api {get} /customer/check-email
   * @apiName checkEmail
   * @apiDescription Service to check whether another user already exists with same email
   * @apiGroup Customer
   * @apiUse authHeader
   * @apiParam {keyword} email search text.
   */
  checkEmail = async req => {
    const data = req.body;
    const query = {
      email: data.keyword,
      deleted: false,
    };
    if (data.id) {
      query._id = { $ne: data.id };
    }
    const resp = await customerService.fieldByCondition(query);
    if (resp.length > 0) {
      return this.sendResponse(
        httpStatus.OK,
        true,
        'The email you entered is already in our system.',
        true,
      );
    }
    return this.sendResponse(httpStatus.OK, true, '', false);
  };
}

export default CustomerController;
