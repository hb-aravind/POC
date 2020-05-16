module.exports = {
  s3: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    bucket: process.env.S3_BUCKET,
    webUrl: process.env.S3_BUCKET_URL,
  },
  SMTP: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  uploadPath: {
    products: 'express/products/',
    categories: 'express/categories/',
    options: 'express/options/',
    banners: 'express/banners/',
  },

  changePasswordPath: '/reset-password/',
  setPasswordPath: '/set-password/',
  setAgentPasswordPath: '/agent/set-password/',
  setSubAgentPasswordPath: '/sub-agents/set-password/',
  serviceProviderPath: '/service-provider/',
  userPath: '/users/',
  agentPath: '/agents/',
  customerVerificationPath: '/users/verify-email/',
  logo: '/assets/images/logo.png',
  facebooklogo: '/assets/img/facebook.png',
  twitterlogo: '/assets/img/twitter.png',
};
