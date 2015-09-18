var fs = require('fs');
var merge = require('merge');

var defaultConfigFile = 'conf/default-config.json';
var userdataConfigFile = 'conf/userdata-config.json';

var config = JSON.parse(fs.readFileSync(defaultConfigFile));

if (fs.existsSync(userdataConfigFile)) {
	var userdataConfig = JSON.parse(fs.readFileSync(userdataConfigFile));
	config = merge.recursive(true, config, userdataConfig);
}

module.exports = config;