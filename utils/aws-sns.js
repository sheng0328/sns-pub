var _ = require('lodash');
var AWS = require('aws-sdk');
var moment = require('moment');

var options = { region: 'us-west-2' };
var sns = new AWS.SNS(options);

listTopics();

function listTopics() {
	var params = {};
	sns.listTopics(params, function(err, data) {
		console.log('=== listTopics ===');
		if (err) {
			console.log(err, err.stack);
		} else {
			console.log(data);
			if (data.Topics) {
				data.Topics.forEach(function(topic) {
					if (_.endsWith(topic.TopicArn, 'mail2me')) {
						publish(topic.TopicArn);
					}
				});
			}
		}
	});
}

function publish(topicArn) {
	var params = {
		Subject: 'My AWS-SNS Publish',
		Message: 'My SNS Message at ' + moment().toString(),
		TopicArn: topicArn
	};

	sns.publish(params, function(err, data) {
		console.log('=== publish ===');
	    if (err) console.log(err, err.stack);
        else     console.log(data);
    });
}