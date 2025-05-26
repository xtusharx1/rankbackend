const AWS = require('aws-sdk');
const config = require('../config/awsconfig');

AWS.config.update({
  region: config.region,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
});

const s3 = new AWS.S3();

const uploadFile = (fileName, fileContent) => {
  const params = {
    Bucket: config.bucketName,
    Key: fileName,
    Body: fileContent,
  };

  return s3.upload(params).promise();
};

module.exports = {
  uploadFile,
};
