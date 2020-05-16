import express from 'express';
import { body } from 'express-validator';
import AuthController from './auth.controller';
import { controllerHandler } from '../utils/async.handler';

import UserRoutes from './controllers/users';
import CustomerRoute from './controllers/customers';
import defaultLimiter from '../services/rate-limiter.service';

import authMiddleWare from './middlewares/authentication';

const router = express.Router();
const authController = new AuthController();

class AdminRoutes {
  static routes() {
    router.post(
      '/login',
      defaultLimiter,
      [
        body('email')
          .isLength({ min: 1 })
          .withMessage('Email is required'),
        body('password')
          .isLength({ min: 1 })
          .withMessage('Password is required'),
      ],
      controllerHandler(authController.login, req => [req]),
    );

    router.post(
      '/forgot-password',
      defaultLimiter,
      [
        body('email')
          .isLength({ min: 1, max: 255 })
          .withMessage('email is required')
          .isEmail()
          .withMessage('Please enter valid email.')
          .trim()
          .escape(),
      ],
      controllerHandler(authController.forgotPassword, req => [req]),
    );

    router.post(
      '/verify-token',
      [
        body('id')
          .isMongoId()
          .withMessage('Id is required and it should mongoId.'),
        body('code')
          .not()
          .isEmpty()
          .withMessage('code is required to match'),
      ],
      controllerHandler(authController.verifyToken, req => [req]),
    );

    router.post(
      '/verify-approve-token',
      [
        body('id')
          .isMongoId()
          .withMessage('Id is required and it should mongoId.'),
        body('code')
          .not()
          .isEmpty()
          .withMessage('code is required to match'),
      ],
      controllerHandler(authController.verifyApproveToken, req => [req]),
    );

    router.post(
      '/set-password',
      [
        body('id')
          .isMongoId()
          .withMessage('Id is required and it should mongoId.'),
        body('password')
          .not()
          .isEmpty()
          .withMessage('password is required.'),
      ],
      controllerHandler(authController.setPassword, req => [req]),
    );

    router.post(
      '/change-password',
      [
        body('id')
          .isMongoId()
          .withMessage('Id is required and it should mongoId.'),
        body('oldPassword')
          .not()
          .isEmpty()
          .withMessage('oldPassword is required.'),
        body('newPassword')
          .not()
          .isEmpty()
          .withMessage('newPassword is required.'),
      ],
      controllerHandler(authController.changePassword, req => [req]),
    );

    router.use(authMiddleWare.authenticate);
    router.use('/users', UserRoutes);
    router.use('/customers', CustomerRoute);
    return router;
  }
}
export default AdminRoutes.routes();
