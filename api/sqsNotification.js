var AWS = require('aws-sdk');
var _ = require('lodash');
var curl = require('../utils/curl');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var data = {
    header: req.headers,
    body: req.body
  };
  console.log(JSON.stringify(data, undefined, 2));

  res.send('router.get respond with a resource');
});

router.post('/', function(req, res, next) {
  var data = {
    header: req.headers,
    body: req.body
  };
  console.log(JSON.stringify(data, undefined, 2));

  if (req.body.SubscribeURL) {
    console.log('=== subscribe url ===');
    curl.execRequest(req.body.SubscribeURL, function(err, data) {
      if (err) console.log(err);
      else     console.log(data);
    });
  }

  if (req.body.Type === 'Notification') {
    var message = JSON.parse(req.body.Message);
    var alarmName = message.AlarmName;
    if (alarmName) {
      console.log('=== process alarm ===');
      sqsName = message.Trigger.Dimensions[0].value;
      console.log('alarmName = ' + alarmName);
      console.log('sqsName = ' + sqsName);

      setAlarmState(alarmName);
    }
  }
  res.send('router.post respond with a resource');
});

function setAlarmState(alarmName) {
  setTimeout(function() {
    var options = { region: 'us-west-2' };
    var cloudwatch  = new AWS.CloudWatch(options);

    var params = {
      AlarmName: alarmName,
      StateReason: 'Reset Alarm',
      StateValue: 'OK'
    };
    cloudwatch.setAlarmState(params, function(err, data) {
      console.log('=== setAlarmState ===');
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  }, 30 * 1000);
}

module.exports = router;
