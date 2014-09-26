var fs, path,
  __indexOf = [].indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
      }
      return -1;
    };

fs = require('fs');
path = require('path');

module.exports = function(robot, scripts) {
  var scriptsPath;
  scriptsPath = path.resolve(__dirname, 'src');
  return fs.exists(scriptsPath, function(exists) {
    var script, _i, _len, _ref, _results;
    if (exists) {
      _ref = fs.readdirSync(scriptsPath);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        script = _ref[_i];
        if ((scripts != null) && __indexOf.call(scripts, '*') < 0) {
          if (__indexOf.call(scripts, script) >= 0) {
            _results.push(robot.loadFile(scriptsPath, script));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(robot.loadFile(scriptsPath, script));
        }
      }
      return _results;
    }
  });
};