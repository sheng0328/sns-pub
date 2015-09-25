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

  var responseBody = {
    'errorCode': 0,
    'errorMsg': ''
  };
  res.status(200).json(responseBody);
});

module.exports = router;
