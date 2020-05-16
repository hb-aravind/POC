import jwtService from './jwt.service';
import config from '../config';
import utils from '../utils';

class TokenService {
  getToken = async (req, user) => {
    const tokenData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role._id,
      resetVerificationCode: user.resetVerificationCode ? user.resetVerificationCode : null,
      status: user.status ? user.status : null,
      profileImg:
        user.profile_pic && user.profile_pic.length > 0
          ? config.awsWebUrl + config.uploadPath.user + user.profile_pic[0]
          : '',
    };
    tokenData.loc = utils.getPasswordHash(`${req.ip}${req.headers['user-agent']}${user._id}`);
    const createdToken = jwtService.createJwtToken(tokenData, {
      expiresIn: '2h',
    });
    const returnData = {
      token: createdToken,
    };
    return returnData;
  };
}

export default new TokenService();
