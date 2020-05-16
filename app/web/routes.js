import express from 'express';

import customers from './controllers/customers';
import auth from './controllers/customers/auth.routes';

const router = express.Router();

class WebRoutes {
  static routes() {
    router.use('/auth', auth);

    router.use('/customer', customers);

    return router;
  }
}
export default WebRoutes.routes();
