import { body, param, checkSchema } from 'express-validator';
import express from 'express';
import CustomerController from './customers.controller';
import { controllerHandler } from '../../../utils/async.handler';
import validator from './customer.validation';
import Enum from '../../../utils/enums';

const controller = new CustomerController();
const router = express.Router();

class CustomerRoute {
  static route() {
    router.post('/list', controllerHandler(controller.list, req => [req]));

    router.get(
      '/:id',
      [
        param('id')
          .isMongoId()
          .withMessage('Please provide valid unique identifier for customer.'),
      ],
      controllerHandler(controller.getById, req => [req]),
    );

    router.post(
      '/change-status',
      [
        body('ids')
          .isLength({ min: 1 })
          .withMessage('please select customers to update status.'),
        body('ids.*')
          .isMongoId()
          .withMessage('Please provide valid unique identifier for customer.'),
        body('status')
          .isLength({ min: 1 })
          .withMessage('status is required.')
          .isIn(Object.values(Enum.STATUS))
          .withMessage(),
      ],
      controllerHandler(controller.changeStatus, req => [req]),
    );

    router.post(
      '/create',
      checkSchema(validator.create()),
      controllerHandler(controller.create, req => [req]),
    );

    router.put(
      '/:id',
      checkSchema(validator.update()),
      controllerHandler(controller.update, req => [req]),
    );

    router.post(
      '/check-email',
      [
        body('keyword')
          .isLength({ min: 1 })
          .withMessage('please enter keyword to check email.'),
        body('id'),
      ],

      controllerHandler(controller.checkEmail, req => [req]),
    );
    return router;
  }
}
export default CustomerRoute.route();
