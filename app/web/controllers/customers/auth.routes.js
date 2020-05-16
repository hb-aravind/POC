import express from 'express';
import { checkSchema } from 'express-validator';

import { controllerHandler } from '../../../utils/async.handler';
import CustomerController from './customer.controller';
import Validator from './customer.validation';

const router = express.Router();
const controller = new CustomerController();

class AuthRoutes {
  static routes() {
    router.post(
      '/login',
      checkSchema(Validator.login()),
      controllerHandler(controller.login, req => [req]),
    );

    router.put(
      '/set-password',
      checkSchema(Validator.setPassword()),
      controllerHandler(controller.setPassword, req => [req]),
    );

    router.post(
      '/forgot-password',
      checkSchema(Validator.email()),
      controllerHandler(controller.forgotPassword, req => [req]),
    );
    return router;
  }
}
export default AuthRoutes.routes();
