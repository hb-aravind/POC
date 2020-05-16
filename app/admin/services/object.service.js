import config from '../../config';
import utils from '../../utils';
import Enum from '../../utils/enums';

/**
 * Get user object to return in response
 * @param {Object} item User detail to transform
 *
 * @return User detail object
 */
class ObjectService {
  getUserDetailObject = (item, withImage) => {
    const doc = {
      id: item.id,
      name: item.fullName,
      email: item.email,
      mobile: item.mobile ? item.mobile : '',
      phone: item.phone ? item.phone : '',
      gender: item.gender ? item.gender : '',
      status: item.status,
      updated: utils.getDateInFormat(item.updated),
    };

    if (withImage && withImage === true) {
      doc.image =
        item.profile_pic && item.profile_pic.length > 0
          ? config.awsWebUrl + config.uploadPath.user + item.profile_pic[0]
          : '';
    }

    return doc;
  };

  getCustomerDetailObject = item => {
    const doc = {
      name: `${item.firstName} ${item.lastName}`,
      email: item.email,
      gender: item.gender ? item.gender : '',
      active: item.active,
      mobile: item.mobile,
      birthdate: item.birthdate,
      address: {
        country: item.address.country,
        state: item.address.state,
        city: item.address.city,
        dailCode: item.address.dailCode,
      },
    };
    return doc;
  };

  getUserAutocompleteObject = item => {
    const doc = {
      id: item._id,
      name: item.fullName,
    };

    return doc;
  };

  getUserListObject = item => {
    const doc = {
      id: item.id,
      role: item.role,
      fullName: `${item.firstName} ${item.lastName}`,
      email: item.email,
      mobile: item.mobile,
      status: item.status,
    };
    return doc;
  };
}

export default new ObjectService();
