import BaseService from '../../services/base.service';
import utils from '../../utils';
import SystemEmails from '../../models/systemEmails.model';

class SystemEmailService extends BaseService {
  constructor() {
    super(SystemEmails);
  }

  getByCondition = (query, options) => this.model.paginate(query, options);

  create = async data => {
    try {
      const result = await this.model.create(data);

      return { id: result.id };
    } catch (err) {
      err.code = 404;
      throw err;
    }
  };

  list = async options => {
    const selectFields = ['title', 'code', 'subject', 'fromName', 'fromEmail'];

    const AND = [{ _id: { $exists: true } }];

    if (options.keyword) {
      AND.push({
        $or: [
          { title: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { code: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { subject: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { fromName: new RegExp(`.*${options.keyword}.*`, 'gi') },
          { fromEmail: new RegExp(`.*${options.keyword}.*`, 'gi') },
        ],
      });
    }

    const result = await this.getByCondition(
      {
        $and: AND,
      },
      {
        selectFields,
        sort: options.sort,
        page: options.page,
        limit: options.limit,
      },
    );

    if (result && result.docs.length) {
      const docs = [];
      result.docs.forEach(row => {
        docs.push({
          id: row._id,
          title: utils.unescape(row.title),
          subject: utils.unescape(row.subject),
          code: utils.unescape(row.code),
          fromName: utils.unescape(row.fromName),
          fromEmail: utils.unescape(row.fromEmail),
        });
      });
      result.docs = docs;
      return result;
    }
    return result;
  };
}

export default new SystemEmailService();
