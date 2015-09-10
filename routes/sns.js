var _ = require('lodash');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(req, safeCycles(), 2);
  //console.log(_(req).toString());
  //console.log(req);
  res.send('respond with a resource');
});

// A JSON stringifier that handles cycles safely.
// Usage: JSON.stringify(obj, safeCycles())
function safeCycles() {
  var seen = [];
  return function (key, val) {
    if (!val || typeof (val) !== 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  };
}

module.exports = router;
