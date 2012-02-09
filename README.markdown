simplescheme.js
===============

This is a very simple (Scheme-like) Lisp interpreter implemented in Javascript. I started working on this for fun and to help me study for my programming languages class.

You can demo the interpreter with this [rudimentary web interface](http://gaia.ecs.csus.edu/~vollmerm/simplescheme.js/).

Usage
-----

Pass lisp code to the parse() function to eval it. A string containing s-expressions is returned.

So this:

```scheme
(define (fact n)
  (if (<= n 1) 1
      (* n (fact (- n 1)))))

(fact 10) ; 3628800
```

Becomes this:

```javascript
parse('(define (fact n) (if (<= n 1) 1 (* n (fact (- n 1)))))(fact 10)');
// '3629900'
```
Comments (anything from a ; to the end of a line) are removed by the parser.

Implementation details
----------------------

### eval

simplescheme.js is primarily built around a single eval() function. It takes two parameters: an expression (in the form of a Javascript array) and an environment (in the form of a Context object).

Eval has a few base cases (if, cond, define, lambda, etc). If none of these are the case, then it assumes that the expression is in the form of (function *parameters) and attempts to call it.

### environment

Context objects use a hash table for local values and variables, and a linked list containing its parent(s). This way, an attempt to look up a given value will first check the immediate or local context, then check the one directly above it, and so on, all the way back down to the global context.

### lambda

Although Javascript supports anonymous functions that resemble lambda functions, I ended up defining a new object type for lambda functions. In order to implement tail recursion (see below), I needed access to the expression and argument list of the function, which would have been abstracted away if I relied (as I originally did) on Javascript function objects.

### tail recursion

Tail recursion in the interpreter is done with a while(true) loop in eval. Rather than recursively calling eval, the current expression (x, or the first parameter of eval) is modified, and then the loop iterates again with the new value of x. So, to support tail recursion (and tail call optimization in general), x and env can be changed inside the function. Because eval is not called recursively in these cases, the stack does not grow.

I based my implementation of tail recursion on [Peter Norvig's lis.py](http://norvig.com/lispy2.html).

Progress
--------

This is definitely beta quality software. I've been changing/adding/removing code pretty rapidly while working on it, and my testing isn't as thorough as it should be. Nonetheless, the core features are reasonably complete and the interpreter is definitely useable in its current state.

Most basic Scheme functions are implemented: car, cdr, cons, list, if, cond, define, lambda, null?, and so on. A few math functions are included (stuff like cos, sin, sqrt). It also supports the display function, which currently prints to a special display buffer object that is printed in the output of parse(). See the source for a complete list of the built-in functions.

I've started trying to integrate it with node.js, which I have almost no familiarity with. To make this eaiser I've adopted the CommonJS module pattern.

Extending
---------

Adding new primitive functions is fairly simple -- javascript functions can be inserted directly into the global scope by calling root_env.add(name,function).

In the future I plan to have a more extensive system for adding functions from outside.

Sources
-------

To build the context objects I used an [existing hash table script](http://rick.measham.id.au/javascript/hash.htm), and for the number handling and arithmetic I used the [js-numbers](https://github.com/dyoo/js-numbers) library. I also used [CodeMirror](http://codemirror.net/) for the syntax coloring in the editor.

These sources were useful to me while implementing simplescheme.js.

 * http://mitpress.mit.edu/sicp/
 * http://www.cs.sjsu.edu/~louden/pltext3.html
 * http://onestepback.org/index.cgi/Tech/Ruby/lispInRuby.red
 * http://norvig.com/lispy.html
 * http://rick.measham.id.au/javascript/hash.htm
 * https://developer.mozilla.org/en/JavaScript/Reference
