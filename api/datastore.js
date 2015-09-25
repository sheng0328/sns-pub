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
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
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
    //AttributeNames: [ 'All' ],
		MaxNumberOfMessages: 10
    //WaitTimeSeconds: 0
	};

  sqs.receiveMessage(params, callback);
}

module.exports = router;
