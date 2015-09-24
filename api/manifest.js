var AWS = require('aws-sdk');
var async = require('async');
var _ = require('lodash');
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

  try {
    var count = 0;
    var entries = [];

    async.doWhilst(
      function(callback) {
        receiveMessage(req.body.dataSQSRegion, req.body.dataSQSName, function(err, data) {
          count = data.length;
          //console.log(data);
          data.forEach(function(entry) {
            entries.push(entry);
          });

          callback(null, '');
        });
      },
      function() { return count > 0 },
      function(err) {
        console.log('=== process notification finish ===');
        //setAlarmState(alarmName);
        var entriesGroup = _.chunk(entries, 10);
        entriesGroup.forEach(function(chunk) {
          console.log({ 'entries': chunk });
          var manifestS3Bucket = 'esc-manifest-sheng0328';
          var manifestS3Key = path.join(req.body.dataSQSName, 'manifest', uuid.v4() + '.json');
          putObject(req.body.dataSQSRegion, manifestS3Bucket, manifestS3Key, { 'entries': chunk });

          var manifestSQSMessage = {
            'manifestS3Region': req.body.dataSQSRegion,
            'manifestS3Bucket': manifestS3Bucket,
            'manifestS3Path': manifestS3Key,
            'manifestSQSRegion': req.body.dataSQSRegion,
            'manifestSQSName': 'ManifestSQS-sheng0328',
            'sourceS3Region': req.body.dataSQSRegion,
            'sourceS3Bucket': '<sourceS3Bucket>',
            'sourceS3Prefix': '<sourceS3Prefix>'
          };
          sendMessage(req.body.dataSQSRegion, 'ManifestSQS-sheng0328', manifestSQSMessage);
        });
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
    AttributeNames: [ 'All' ],
		MaxNumberOfMessages: 10,
    WaitTimeSeconds: 0
	};

  var count = 0;
	sqs.receiveMessage(params, function(err, data) {
		console.log('=== sqs receive message ===');
		if (err) {
			console.log(err, err.stack);
		} else {
			//console.log(data);
      var entries = [];
			if (data.Messages) {
        console.log('length = ' + data.Messages.length);
        count = data.Messages.length;

        data.Messages.forEach(function(message) {
          //console.log(message);
          var receiptHandle = message.ReceiptHandle;
          var body = JSON.parse(message.Body);
          //console.log('receiptHandle = ' + receiptHandle);
          var s3 = body.Records[0].s3;
          var sourceS3FullPath = 's3://' + s3.bucket.name + '/' + s3.object.key;
          entries.push({ 'url': sourceS3FullPath, 'mandatory': false });
          console.log(sourceS3FullPath);

          // {
          //   "entries": [
          //     {"url":"s3://mybucket-alpha/2013-10-04-custdata", "mandatory":true},
          //     {"url":"s3://mybucket-alpha/2013-10-05-custdata", "mandatory":true},
          //     {"url":"s3://mybucket-beta/2013-10-04-custdata", "mandatory":true},
          //     {"url":"s3://mybucket-beta/2013-10-05-custdata", "mandatory":true}
          //   ]
          // }

          //deleteMessage(sqsRegion, sqsName, receiptHandle);
          //callback(null, '');
        });
        callback(null, entries);
			} else {
        console.log('length = 0');
        callback(null, entries);
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
      console.log('=== sqs delete message ===');
      if (err) console.log(err, err.stack);
      else     console.log(data);
	});
}

function putObject(region, bucket, key, data) {
  var options = { region: region };
  var s3 = new AWS.S3(options);

	var params = {
    //Bucket: 'esc-manifest-sheng0328',
    Bucket: bucket,
    Key: key,
    //Key: path.join(sqsName, 'manifest', uuid.v4() + '.json'),
    Body: JSON.stringify(data, undefined, 2)
	};

  s3.putObject(params, function(err, data) {
    console.log('=== s3 put object ===');
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

function sendMessage(region, sqsName, message) {
  var options = { region: region };
  var sqs = new AWS.SQS(options);

  var params = {
    MessageBody: JSON.stringify(message, undefined, 2),
    QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName
  };
  sqs.sendMessage(params, function(err, data) {
    console.log('=== sqs send message ===');
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
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
      console.log('=== cloudwatch set alarm state ===');
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  }, 90 * 1000);
}

module.exports = router;
