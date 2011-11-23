simplescheme.js
===============

This is a very simple LISP interpreter implemented in Javascript. I started working on this for fun and to help me study for my programming languages class.

You can demo the interpreter with this [rudimentary web interface](http://gaia.ecs.csus.edu/~vollmerm/simplescheme.js/).

Usage
-----

Pass LISP code to the parse() function to eval it, or pass LISP-like code in Javascript array form to the eval function directly.

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
// 3629900
```

And Javascript arrays can be eval'd directly:

```javascript
eval_l(['+',1,['*',3,4]]);
// 13
```

Comments (anything from a ; to the end of a line) are removed by the parser.

Implementation details
----------------------

simplescheme.js is primarily built around a single eval() function. It takes two parameters: an expression (in the form of a Javascript array) and an environment (in the form of a Context object). Context objects use a hash table for local values and variables, and a linked list containing its parent(s). This way, an attempt to look up a given value will first check the immediate or local context, then check the one directly above it, and so on, all the way back down to the global context.

Javascript supports higher order functions, which greatly simplified the implementation of LISP's lambda functions. To create a lambda function, I created a Javascript function that defined a new context (where the arguments are mapped to the function signature's parameters and added to the local context) and passes it to eval along with its expression.

Eval has a few base cases (if statement, define, lambda, value, etc). If none of these are the case, then it assumes that the expression is in the form of (function *parameters) and attempts to call it. If you get a weird Javascript error about apply not being a valid function, it's probably because you passed a list to eval that it didn't understand, so it tried to call the first element as a function.

To build the context objects I used an [existing hash table script](http://rick.measham.id.au/javascript/hash.htm). It's very simple and elegent, and it's open source, so I decided to use it rather than implement my own. I also used [CodeMirror](http://codemirror.net/) for the syntax coloring in the editor.

Progress
--------

While it's usable, a lot is missing from the interpreter in its current state. Currently there is only very basic error checking. Numbers and strings are the only supported types.

Most basic Scheme functions are implemented: car, cdr, cons, list, if, cond, define, lambda, null?, and so on. A few math functions are included (stuff like cos, sin, sqrt). See the source for a complete list.

Also, it's a bit buggy. It hasn't been very thoroughly tested so far.

Extending
---------

Adding new primitive functions is fairly simple -- javascript functions can be inserted directly into the global scope by calling root_env.add(name,function).

Sources
-------

These sources were useful to me while implementing simplescheme.js.

 * http://mitpress.mit.edu/sicp/
 * http://www.cs.sjsu.edu/~louden/pltext3.html
 * http://onestepback.org/index.cgi/Tech/Ruby/LispInRuby.red
 * http://norvig.com/lispy.html
 * http://rick.measham.id.au/javascript/hash.htm
 * https://developer.mozilla.org/en/JavaScript/Reference
