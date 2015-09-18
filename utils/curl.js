var https = require('https');
var urlParse = require('url-parse');

exports.execRequest = function(urlString, callback) {
  var url = urlParse(urlString);
  var options = {
    hostname: url.host,
    port: 443,
    method: 'GET',
    path: url.pathname + url.query
  };

  var data = {};
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');

    var responseBody = '';
    res.on('data', function (chunk) {
      responseBody += chunk;
    });

    res.on('end', function() {
      data.status = res.statusCode;
      data.body = responseBody;
      callback(null, data);
    });
  });

  req.on('error', function(err) {
    callback(err);
  });

  // write data to request body
  //req.write(JSON.stringify(params.requestBody));
  req.end();
}
