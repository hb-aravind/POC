import mongoose from 'mongoose';
import Enum from '../utils/enums';
import timestamps from '../utils/timestampPlugin';
import utils from '../utils';
import mongoosePaginate from '../utils/paginatePlugin';

const SystemEmailSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: Enum.LENGTH.Email.Title,
    index: true,
  },
  code: {
    type: String,
    required: true,
    maxlength: Enum.LENGTH.Email.Code,
    index: true,
    unique: true,
  },
  subject: {
    type: String,
    required: true,
    maxlength: Enum.LENGTH.Email.Subject,
  },
  fromName: {
    type: String,
    required: true,
    maxlength: Enum.LENGTH.Email.Title,
  },
  fromEmail: {
    type: String,
    required: true,
    maxlength: Enum.LENGTH.Email.Title,
  },
  bcc: {
    type: String,
    maxlength: Enum.LENGTH.Email.Bcc,
  },
  cc: {
    type: String,
    maxlength: Enum.LENGTH.Email.Cc,
  },
  variables: [
    {
      _id: false,
      name: {
        type: String,
        maxlength: Enum.LENGTH.Email.variables,
      },
      description: {
        type: String,
        maxlength: Enum.LENGTH.Email.Description,
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(Enum.STATUS),
    default: Enum.STATUS.Pending,
  },
  message: {
    type: String,
    required: true,
  },
});
SystemEmailSchema.path('code').validate({
  async validator(value) {
    const self = this;
    const entity = await this.constructor.findOne({ code: value });
    if (entity) {
      if (self.id === entity.id) {
        return true;
      }
      return false;
    }
    return true;
  },
  message: 'The code you entered is already in our system.',
});
SystemEmailSchema.path('code').get(item => utils.unescape(item));
SystemEmailSchema.plugin(mongoosePaginate);
SystemEmailSchema.plugin(timestamps, { index: true });

const SystemEmails = mongoose.model('system_emails', SystemEmailSchema);
export default SystemEmails;
