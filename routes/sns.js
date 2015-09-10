var _ = require('lodash');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log('headers: ');
  console.log(req.headers, undefined, 2);
  console.log('body: ');
  console.log(req.body, undefined, 2);
  res.send('router.get respond with a resource');
});

/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log('headers: ');
  console.log(req.headers, undefined, 2);
  console.log('body: ');
  console.log(req.body, undefined, 2);
  res.send('router.post respond with a resource');
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
