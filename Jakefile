// Requires
var util = require('util'),
    exec = require('child_process').exec,
    fs = require('fs'),
    stitch = require('stitch'),
    child;

desc('Default task.');
task('default',[], function(params){
  console.log('This is the default task. Run jake browser to generate file.');
});

desc('Compile package for browser');
task('browser',[],function(params){
  var package = stitch.createPackage({
    paths: [__dirname + '/lib']
  });
  package.compile(function (err, source){
  fs.writeFile('sscheme_browser.js', source, function (err) {
    if (err) throw err;
    console.log('Compiled sscheme_browser.js');
  })
})
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
