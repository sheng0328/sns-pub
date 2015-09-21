var _ = require('lodash');
var urlParse = require('url-parse');

exports.execRequest = function(urlString, callback) {
  var url = urlParse(urlString);
  //console.log(url);

  var http = require(_.startsWith(url.protocol, 'https')? 'https' : 'http');

  var options = {
    hostname: url.host,
    port: url.port || _.startsWith(url.protocol, 'https')? 443 : 80,
    method: 'GET',
    path: url.pathname + url.query
  };
  //console.log(options);

  var data = {};
  var req = http.request(options, function(res) {
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
