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

  try {
    var startUnixTime = moment().valueOf(); // milliseconds
    //var startUnixTime = moment().unix(); // seconds
    var maxReceiveTime = 200;
    var count = 0;
    var messages = [];

    async.doWhilst(
      function(callback) {
        receiveMessage(req.body.dataSQSRegion, req.body.dataSQSName, function(err, data) {
          if (err) {
            console.log(err, err.stack);
            callback(err);
          } else {
            if (data.Messages) {
              count = data.Messages.length;
              console.log('length = ' + count);
              data.Messages.forEach(function(message) {
                messages.push(message);
              });
            } else {
              count = 0;
              console.log('length = ' + count);
            }

            callback(null);
          }
        });
      },
      function() {
        var nowUnixTime = moment().valueOf();
        console.log('spent time (ms) = ' + (nowUnixTime - startUnixTime));
        return count > 0 && (maxReceiveTime > nowUnixTime - startUnixTime);
      },
      function(err) {
        console.log('=== process notification finish ===');

        var groups = _.chunk(messages, 10); // split array
        groups.forEach(function(chunk) {
          console.log('length = ' + chunk.length);

          var manifestS3Bucket = 'esc-manifest-sheng0328';
          var manifestS3Key = path.join(req.body.dataSQSName, 'manifest', uuid.v4() + '.json');

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

          async.series([
              function(callback) {
                putObject(req.body.dataSQSRegion, manifestS3Bucket, manifestS3Key, chunk, callback);
              },
              function(callback) {
                sendMessage(req.body.dataSQSRegion, 'ManifestSQS-sheng0328', manifestSQSMessage, callback);
              },
              function(callback) {
                deleteMessageBatch(req.body.dataSQSRegion, req.body.dataSQSName, chunk, callback);
              }
          ],
          function(err, results) {
            console.log('finish a group ' + results);
          });
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
    //AttributeNames: [ 'All' ],
		MaxNumberOfMessages: 10
    //WaitTimeSeconds: 0
	};

  sqs.receiveMessage(params, callback);
}

function putObject(region, bucket, key, messages, callback) {
  var entries = [];
  messages.forEach(function(message) {
    var body = JSON.parse(message.Body);
    var s3 = body.Records[0].s3;
    var sourceS3FullPath = 's3://' + s3.bucket.name + '/' + s3.object.key;
    entries.push({ 'url': sourceS3FullPath, 'mandatory': false });
  });

  var options = { region: region };
  var s3 = new AWS.S3(options);

	var params = {
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify({ 'entries': entries }, undefined, 2)
	};

  s3.putObject(params, function(err, data) {
    console.log('=== s3 put object ===');
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response

    callback(null, 's3PutObject');
  });
}

function sendMessage(sqsRegion, sqsName, message, callback) {
  var options = { region: sqsRegion };
  var sqs = new AWS.SQS(options);

  var params = {
    MessageBody: JSON.stringify(message, undefined, 2),
    QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName
  };
  sqs.sendMessage(params, function(err, data) {
    console.log('=== sqs send message ===');
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response

    callback(null, 'sqsSendMessage');
  });
}

function deleteMessageBatch(sqsRegion, sqsName, messages, callback) {
  var entries = [];
  messages.forEach(function(message) {
    entries.push({ 'Id': message.MessageId, 'ReceiptHandle': message.ReceiptHandle });
  });

  var options = { region: sqsRegion };
  var sqs = new AWS.SQS(options);

  var params = {
    Entries: entries,
    QueueUrl: 'https://sqs.us-west-2.amazonaws.com/764054367471/' + sqsName
  };

	sqs.deleteMessageBatch(params, function(err, data) {
      console.log('=== sqs delete message batch ===');
      if (err) console.log(err, err.stack);
      else     console.log(data);

      callback(null, 'sqsDeleteMessageBatch');
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
