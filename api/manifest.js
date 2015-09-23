var AWS = require('aws-sdk');
var async = require('async');
var _ = require('lodash');
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

  try {
    var count = 0;

    async.doWhilst(
      function(callback) {
        receiveMessage(req.body.dataSQSRegion, req.body.dataSQSName, function(err, data) {
          count = data;
          callback(null);
        });
      },
      function() { return count === 5 },
      function(err) {
        //console.log('=== process notification finish ===');
        //setAlarmState(alarmName);
      }
    );
  } catch (ex) {
    console.log(ex);
  }

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
		MaxNumberOfMessages: 5
	};

  var count = 0;
	sqs.receiveMessage(params, function(err, data) {
		console.log('=== receive sqs message ===');
		if (err) {
			console.log(err, err.stack);
		} else {
			//console.log(data);
			if (data.Messages) {
        console.log('length = ' + data.Messages.length);
        count = data.Messages.length;

        data.Messages.forEach(function(message) {
          var receiptHandle = message.ReceiptHandle;
          var body = JSON.parse(message.Body);
          //console.log('receiptHandle = ' + receiptHandle);
          console.log(body.Records[0]);

          //deleteMessage(sqsRegion, sqsName, receiptHandle);
          //callback(null, '');
        });
        callback(null, count);
			} else {
        console.log('length = 0');
        callback(null, count);
      }
		}
	});
}

function deleteMessage(sqsRegion, sqsName, receiptHandle) {
  var options = { region: sqsRegion };
  var sqs = new AWS.SQS(options);

	var params = {
		QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName,
		ReceiptHandle: receiptHandle
	};

	sqs.deleteMessage(params, function(err, data) {
      console.log('=== delete sqs message ===');
      if (err) console.log(err, err.stack);
      else     console.log(data);
	});
}

function setAlarmState(alarmName) {
  console.log('=== set tomeout ===');
  setTimeout(function() {
    var options = { region: 'us-west-2' };
    var cloudwatch  = new AWS.CloudWatch(options);

    var params = {
      AlarmName: alarmName,
      StateReason: 'Reset Alarm',
      StateValue: 'OK'
    };
    cloudwatch.setAlarmState(params, function(err, data) {
      console.log('=== set cloudwatch alarm state ===');
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  }, 90 * 1000);
}

module.exports = router;
