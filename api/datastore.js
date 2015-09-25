var AWS = require('aws-sdk');
var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var uuid = require('uuid');
var curl = require('../utils/curl');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  {
    var data = {
      remoteAddress: (req.connection? req.connection.remoteAddress : ''),
      baseUrl: req.baseUrl || req.url,
      header: req.headers,
      body: req.body
    };
    console.log(JSON.stringify(data, undefined, 2));
  }

  receiveMessage(req.body.manifestSQSRegion, req.body.manifestSQSName, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      data.Messages.forEach(function(message) {
        var body = JSON.parse(message.Body);
        console.log(body);
        copyCmd();
      });
    }
  });

  var responseBody = {
    'errorCode': 0,
    'errorMsg': ''
  };
  res.status(200).json(responseBody);
});

function receiveMessage(sqsRegion, sqsName, callback) {
  var options = { region: sqsRegion };
  var sqs = new AWS.SQS(options);

	var params = {
		QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName,
		MaxNumberOfMessages: 1
	};

  sqs.receiveMessage(params, callback);
}

function copyCmd() {
  var copyCmd = '';
  copyCmd += 'copy ' + '<table_name>' + ' from \'s3://' + '<bucket_name>' + '/' + '<manifest_name>' + '\' \n';
  copyCmd += 'credentials \'aws_access_key_id=' + '<access-key-id>' + ';aws_secret_access_key=' + '<secret-access-key>' + '\' \n';
  copyCmd += 'manifest \n';
  //copyCmd += 'gzip \n';
  copyCmd += 'json \'auto\' ;';
  console.log(copyCmd);
}

module.exports = router;
