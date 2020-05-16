import express from 'express';
import { checkSchema } from 'express-validator';

import { controllerHandler } from '../../../utils/async.handler';
import CustomerController from './customer.controller';
import Validator from './customer.validation';

const router = express.Router();
const controller = new CustomerController();

class CustomerRoutes {
  static routes() {
    router.post(
      '/signup',
      checkSchema(Validator.signup()),
      controllerHandler(controller.create, req => [req]),
    );

    router.put(
      '/:id',
      checkSchema(Validator.update()),
      controllerHandler(controller.update, req => [req]),
    );

    router.post(
      '/verify-email',
      checkSchema(Validator.verifyEmail()),
      controllerHandler(controller.verifyEmail, req => [req]),
    );
    return router;
  }
}
export default CustomerRoutes.routes();
