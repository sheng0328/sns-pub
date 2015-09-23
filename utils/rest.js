var _ = require('lodash');
var urlParse = require('url-parse');

exports.performRequest = function(params, callback) {
  var url = urlParse(params.url);
  console.log(url);

  var http = require(_.startsWith(url.protocol, 'https')? 'https' : 'http');
  var headers = {};

  if (params.requestBody) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = new Buffer(JSON.stringify(params.requestBody), 'utf-8').length;
  }
  if (params.cookie) {
    headers['cookie'] = params.cookie;
  }

  var options = {
    hostname: url.host,
    port: url.port || _.startsWith(url.protocol, 'https')? 443 : 80,
    method: params.method || 'GET',
    path: url.pathname + url.query,
    headers: headers,
    rejectUnauthorized: false // let https ignore [Error: DEPTH_ZERO_SELF_SIGNED_CERT]
  };
  console.log(options);

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
  if (params.requestBody) {
    req.write(JSON.stringify(params.requestBody));
  }
  req.end();
}
