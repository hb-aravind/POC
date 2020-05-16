import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import utils from '../utils';
import mongoosePaginate from '../utils/paginatePlugin';
import timestamps from '../utils/timestampPlugin';
import Enum from '../utils/enums';

const CustomerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
      maxlength: Enum.LENGTH.Customer.FirstName,
      default: '',
      index: true,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    lastName: {
      type: String,
      required: false,
      maxlength: Enum.LENGTH.Customer.LastName,
      default: '',
      index: true,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    employeeCode: {
      type: String,
      required: false,
      default: '',
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: Enum.LENGTH.Customer.Email,
      get: val => utils.unescape(val),
      set: val => utils.escape(val),
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    birthdate: {
      required: false,
      type: Date,
    },
    age: {
      type: Number,
    },
    address: {
      country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'country',
        required: false,
      },
      state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'state',
        required: false,
      },
      city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'city',
        required: false,
      },
      dailCode: {
        type: String,
        default: '',
      },
    },
    mobile: {
      type: String,
      maxlength: Enum.LENGTH.Customer.Mobile.Max,
    },

    otp: {
      type: Number,
      default: 0,
    },
    lastlogin: {
      type: Date,
    },
    deviceId: {
      type: String,
      default: '',
    },
    deviceType: {
      type: String,
      default: '',
    },
    deviceToken: {
      // Push notification token
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    receiveNotifications: {
      type: Boolean,
      default: true,
    },
    resetVerificationCode: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    socialMedia: {
      facebook: {
        profileId: { type: String, default: '' },
      },
      twitter: {
        profileId: { type: String, default: '' },
      },
      instagram: {
        profileId: { type: String, default: '' },
      },
      google: {
        profileId: { type: String, default: '' },
      },
    },
    active: {
      type: Boolean,
      default: false,
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
    toObject: { getters: true, virtuals: true },
    toJSON: {
      getters: true,
      virtuals: true,
    },
  },
);

/**
 * Virtuals
 */
CustomerSchema.virtual('password')
  .set(function(password) {
    this.upassword = password;
    this.passwordHash = this.getPasswordHash(password);
  })
  .get(function() {
    return this.upassword;
  });

CustomerSchema.post('save', (error, doc, next) => {
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

CustomerSchema.methods = {
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
CustomerSchema.plugin(mongoosePaginate);
CustomerSchema.plugin(timestamps, { index: true });

const Customer = mongoose.model('customer', CustomerSchema);
export default Customer;
