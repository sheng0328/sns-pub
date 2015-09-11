var AWS = require('aws-sdk');
var moment = require('moment');

//console.log(AWS.config);

var options = { region: 'us-west-2' };
var sqs = new AWS.SQS(options);

listQueue();

var queueUrl = '';

function listQueue() {
	var params = {
		QueueNamePrefix: '' /* optional */
	};

    sqs.listQueues(params, function(err, data) {
    	console.log('=== listQueues ===');
        if (err) {
        	console.log(err, err.stack);
        } else {
        	console.log(data);

        	if (data.QueueUrls) {
        		queueUrl = data.QueueUrls[0];
        		sndMsg();
        	}
        }
    });
}

function sndMsg() {
	var params = {
		MessageBody: JSON.stringify({ time: moment().toString(), msg: 'just4test' }),
		QueueUrl: queueUrl
	};

	sqs.sendMessage(params, function(err, data) {
		console.log('=== sendMessage ===');
		if (err) console.log(err, err.stack);
		else     console.log(data);

		recMsg();
	});
}

function recMsg() {
	var params = {
		QueueUrl: queueUrl
	};

	sqs.receiveMessage(params, function(err, data) {
		console.log('=== receiveMessage ===');
		if (err) {
			console.log(err, err.stack);
		} else {
			console.log(data);
			if (data.Messages) {
				delMsg(data.Messages[0]);
			}
		}
	});
}

function delMsg(msg) {
	var params = {
		QueueUrl: queueUrl,
		ReceiptHandle: msg.ReceiptHandle
	};

	sqs.deleteMessage(params, function(err, data) {
      console.log('=== deleteMessage ===');
      if (err) console.log(err, err.stack);
      else     console.log(data);
	});
}