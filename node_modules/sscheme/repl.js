var tty = require('tty');
process.stdin.resume();
tty.setRawMode(true);
var repl = require("repl");
var scheme = require("./simplescheme").SScheme;
var seval = function (cmd, context, repl, callback) {
  var result = scheme.parse(cmd.slice(1,cmd.length-1));
  callback(null, result);
};
repl.start("simplescheme.js>",null,seval);
