var scheme = require('../lib/simplescheme.js');

exports.test_basic = function(test) {
  test.equal(scheme.parse('(+ 1 2)')[0],'3',"Add one and two");
  test.equal(scheme.parse('(+ 1 (* 4 5))')[0],'21',"Nested function");
  test.done();
};

exports.test_define = function(test) {
  test.equal(scheme.parse('(define a 2) (- a 1)')[0],'1',"Define value");
  test.equal(scheme.parse('(define (fact n) (if (<= n 1) 1 (* n (fact (- n 1)))))(fact 10)')[0],'3628800',"Define and run function");
  test.equal(scheme.parse('(define (facthelp i prod) (if (= i 1) prod (facthelp (- i 1) (* i prod)))) (facthelp 10 1)')[0],'3628800',"Tail function");
  test.done();
};

exports.test_display = function(test) {
  test.equal(scheme.parse('(display "test")')[0],'test',"Display a string");
  test.done();
};
