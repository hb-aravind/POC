import Modules from '../../models/modules.model';
import BaseService from '../../services/base.service';

class ModuleService extends BaseService {
  constructor() {
    super(Modules);
  }
}
export default new ModuleService();
