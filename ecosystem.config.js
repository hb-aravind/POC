module.exports = {
  apps: [
    {
      name: 'api',
      script: 'index.js',
      log_type: 'json',
      log_date_format: 'DD-MM-YYYY HH:mm:ss',
      env_production: {
        NODE_ENV: 'production',
        PORT: '9000',
        JWT_SECRET: 'ApBcxvXEsFYInT9YDsUAPq0pkEDtH',
        MONGO_CONN_URL: 'mongodb://localhost:27017/node-standard-boilerplate',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 465,
        SMTP_USER: 'hbmean@gmail.com',
        SMTP_PASS: 'HiddenM@an2019',
        S3_ACCESS_KEY: 'AKIA3ZYT63TQ6H7K6YUB',
        S3_SECRET_KEY: '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',
        S3_BUCKET: 'hb-mean',
        S3_BUCKET_URL: 'http://hb-mean.s3.ap-south-1.amazonaws.com',
      },
    },
  ],
};
