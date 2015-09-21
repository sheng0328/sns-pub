var AWS = require('aws-sdk');
var moment = require('moment');

//console.log(AWS.config);

var options = { region: 'us-west-2' };
var cloudwatch  = new AWS.CloudWatch(options);

//putMetricData();
setAlarmState();

function putMetricData() {
  var params = {
    MetricData: [ /* required */
      {
        MetricName: 'ApproximateNumberOfMessagesVisible', /* required */
        Dimensions: [
          {
            Name: 'QueueName', /* required */
            Value: 'DataSQS-Trends' /* required */
          }
        ],
        StatisticValues: {
          Maximum: 1.0, /* required */
          Minimum: 1.0, /* required */
          SampleCount: 1.0, /* required */
          Sum: 1.0 /* required */
        },
        Unit: 'Count'
        //Value: 1.0
      },
      /* more items */
    ],
    Namespace: 'SQS' /* required */
  };
  cloudwatch.putMetricData(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}


function setAlarmState() {
  var params = {
    AlarmName: 'alarmDataQ',
    StateReason: 'Reset Alarm',
    StateValue: 'INSUFFICIENT_DATA'
  };
  cloudwatch.setAlarmState(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}
