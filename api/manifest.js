var AWS = require('aws-sdk');
var async = require('async');
var _ = require('lodash');
var curl = require('../utils/curl');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  var data = {
    header: req.headers,
    body: req.body
  };
  console.log(JSON.stringify(data, undefined, 2));

  /*
  if (req.body.Type === 'SubscriptionConfirmation') {
    confirmSubscription(req.body.SubscribeURL);
  }

  if (req.body.Type === 'Notification') {
    try {
      var message = JSON.parse(req.body.Message);
      processNotification(message);
    } catch (ex) {
      console.log(ex);
    }
  }
  */

  res.send('router.post respond with a resource');
});

function confirmSubscription(subscribeURL) {
  if (subscribeURL) {
    console.log('=== confirm subscription ===');
    curl.execRequest(subscribeURL, function(err, data) {
      if (err) console.log(err);
      else     console.log(data);
    });
  }
}

function processNotification(message) {
  var alarmName = message.AlarmName;
  if (alarmName) {
    console.log('=== process notification ===');
    sqsName = message.Trigger.Dimensions[0].value;
    console.log('alarmName = ' + alarmName);
    console.log('sqsName = ' + sqsName);

    var count = 0;

    async.doWhilst(
      function(callback) {
        receiveMessage(sqsName, function(err, data) {
          count = data;
          callback(null, data);
        });
      },
      function() { return count === 2 },
      function(err) {
        console.log('=== process notification finish ===');
        setAlarmState(alarmName);
      }
    );
  }
}

function receiveMessage(sqsName, callback) {
  var options = { region: 'us-west-2' };
  var sqs = new AWS.SQS(options);

	var params = {
		QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName,
		MaxNumberOfMessages: 2
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

          //deleteMessage(sqsName, receiptHandle);
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

function deleteMessage(sqsName, receiptHandle) {
  var options = { region: 'us-west-2' };
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