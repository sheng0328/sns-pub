var async = require('async');
var path = require('path');
var pg = require('pg');
var properties = require('properties');
var config = require('./config');

async.waterfall(
[
    function(callback) {
		  getCredentials(callback);
    },
    function(credentials, callback) {
    	copyFromS3(credentials, callback);
    }
],
function (err, result) {
	console.log('finish');
	return result;
});

function getCredentials(callback) {
	var awsCredentials = path.join(process.env.USERPROFILE, '.aws', 'credentials');

    var options = {
    	path: true,
    	sections: true
    };

	properties.parse(awsCredentials, options, function(err, data) {
		callback(err, data);
	});
}

function copyFromS3(credentials, callback) {
    // var conString = "redshift://user:password@db-endpoint:port/database";
    var conString = 'redshift://' + config.redshift.username + ':' + config.redshift.password;
        conString+= '@' + config.redshift.endpoint + ':' + config.redshift.port;
        conString+= '/' + config.redshift.database;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            console.log(conString);
            console.error('could not connect to redshift', err);
            callback(err);
        } else {
          console.log('connect to redshift success');

          /*
          var queryCmd = 'SELECT catid, catgroup, catname, catdesc FROM public.category LIMIT 500';
          client.query(queryCmd, function(err, result) {
              if (err) {
                  console.error('error running query', err);
                  callback(err);
              }

              console.log("redhshift query: no errors, seem to be successful!");
              console.log(result.rows);

              console.log('close connection');
              client.end();
              callback(null, result);
          });
          */

          var copyCmd = '';
          // copyCmd += 'copy category from \'s3://awssampledbuswest2/tickit/category_pipe.txt\' \n';
          // copyCmd += 'credentials \'aws_access_key_id=' + credentials.default.aws_access_key_id + ';aws_secret_access_key=' + credentials.default.aws_secret_access_key + '\' \n';
          // copyCmd += 'delimiter \'|\';';

          copyCmd += 'copy esc_load from \'s3://esc-manifest-sheng0328/esc-dataSQS-sheng0328/manifest/7c8ddef0-ec2f-4418-b22e-a0db50154a4e.json\' \n';
          copyCmd += 'credentials \'aws_access_key_id=' + credentials.default.aws_access_key_id + ';aws_secret_access_key=' + credentials.default.aws_secret_access_key + '\' \n';
          copyCmd += 'manifest \n';
          //copyCmd += 'gzip \n';
          copyCmd += 'json \'auto\' ;';
          console.log(copyCmd);

          client.query(copyCmd, function(err, result) {
              if (err) {
                  console.error('error running query', err);
                  callback(err);
              }

              console.log("redhshift load: no errors, seem to be successful!");
              console.log(result);

              console.log('close connection');
              client.end();
              callback(null);
          });
        }
    });
}
