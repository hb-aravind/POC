import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import utils from '../utils';
import mongoosePaginate from '../utils/paginatePlugin';
import timestamps from '../utils/timestampPlugin';
import Enum from '../utils/enums';

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: Enum.LENGTH.User.FirstName,
      default: '',
      index: true,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    lastName: {
      type: String,
      required: false,
      maxlength: Enum.LENGTH.User.LastName,
      default: '',
      index: true,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      ref: 'roles',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: Enum.LENGTH.User.Email,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    about: {
      type: String,
      maxlength: Enum.LENGTH.Maximum.Name,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    mobile: {
      type: String,
      default: '',
      maxlength: Enum.LENGTH.User.Mobile.Max,
    },
    lastlogin: {
      type: Date,
    },
    resetVerificationCode: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(Enum.STATUS),
      default: Enum.STATUS.Pending,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    profile_pic: [
      {
        type: String,
        default: [],
      },
    ],
    resetToken: {
      type: String,
      default: '',
    },
    resetTokenExpires: {
      type: Date,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    oldPasswords: {
      type: Array,
      required: false,
      default: null,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: 'category',
      },
    ],

    token: {
      type: String,
      default: '',
    },
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
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  },
);

/**
 * Virtuals
 */

UserSchema.virtual('password')
  .set(function(password) {
    this.upassword = password;
    this.passwordHash = this.getPasswordHash(password);
  })
  .get(function() {
    return this.upassword;
  });
UserSchema.post('save', (error, doc, next) => {
  if (error.name === 'MongoError' && error.code === 11000) {
    const err = new Error('The email you entered is already in our system.');
    err.name = 'MongoError';
    next(err);
  } else {
    next(error);
  }
});

/**
 * Methods
 */

UserSchema.methods = {
  /**
   * Authenticate
   *
   * @param {String} password
   * @return {Boolean}
   */
  authenticate(password, hash) {
    return bcrypt.compareSync(password, hash);
  },
  getPasswordHash(password) {
    return bcrypt.hashSync(password, 10);
  },
};

UserSchema.path('firstName').get(item => utils.unescape(item));

UserSchema.path('lastName').get(item => utils.unescape(item));

UserSchema.path('email').get(item => utils.unescape(item));

UserSchema.plugin(timestamps, { index: true });
UserSchema.plugin(mongoosePaginate);
const User = mongoose.model('user', UserSchema);

export default User;
