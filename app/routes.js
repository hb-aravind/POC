import express from 'express';

import webRoutes from './web/routes';
import adminRoutes from './admin/routes';

import { status } from './utils';

const router = express.Router();

class AllRoutes {
  static routes() {
    router.use('/web', webRoutes);

    router.use('/admin', adminRoutes);

    router.use('*', (req, res) => res.status(status.NOT_IMPLEMENTED).json({
      success: false,
      message: 'The page you requested does not exist.',
    }));
    return router;
  }
}
export default AllRoutes.routes();
