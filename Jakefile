// Requires
var util = require('util'),
    exec = require('child_process').exec,
    child;

desc('Default task.');
task('default',[], function(params){
  console.log('This is the default task.');
});

namespace('test', function() {
  desc('Run all test');
  task('all',[],function() {
    child = exec('nodeunit test',
      function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });
  });
});
