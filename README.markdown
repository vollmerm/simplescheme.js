simplescheme.js
===============

This is a very simple lisp interpreter implemented in Javascript. I started working on this for fun and to help me study for my programming languages class.

You can demo the interpreter with this [rudimentary web interface](http://gaia.ecs.csus.edu/~vollmerm/simplescheme.js/).

Usage
-----

Pass lisp code to the parse() function to eval it, or pass lisp-like code in Javascript array form to the eval function directly.

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

### eval

simplescheme.js is primarily built around a single eval() function. It takes three parameters: an expression (in the form of a Javascript array), an environment (in the form of a Context object), and, optionally, the name of the function it is currently executing (see the section on tail recursion).

Eval has a few base cases (if, cond, define, lambda, etc). If none of these are the case, then it assumes that the expression is in the form of (function *parameters) and attempts to call it.

### environment

Context objects use a hash table for local values and variables, and a linked list containing its parent(s). This way, an attempt to look up a given value will first check the immediate or local context, then check the one directly above it, and so on, all the way back down to the global context.

### lambda

Javascript supports higher order functions, which somewhat simplified the implementation of LISP's lambda functions (though Javascript does not support tail recursion, which became an obstacle). To create a lambda function, I created a Javascript function that defined a new context (where the arguments are mapped to the function signature's parameters and added to the local context) and passes it to eval along with the expression(s) contained in the function. 

### tail recursion

My first attempts at optimizing tail calls into loops involved attempting to detect it beforehand in the code and change it directly into a while loop. Eventually, it occured to me that the best way to detect tail recursion is to run the function.

This approach was complicated by the way I implemented eval. It recursively calls itself quite often, so it might not be able to determine if a given function name it runs into is the same as the one that originally called it (for example, if eval is in the middle of evaluating an if statement). The way I decided to solve this problem was to have a third optional parameter for eval that contains the name of the calling function. That way, the name of the function persists through the recursive calls.

I have a central while loop that loops over a list of expressions to run, popping each off and passing them to eval one-by-one. If eval detects a tail call in the method described above, it will (rather than running it) return a special token that contains the new parameters for the function. This is returned all the way down the stack to the loop and another function call with the new parameters is pushed into the list of expressions so that it will be the next one executed by the while loop. This effectively runs the functions in sequence rather than nesting them, and it also takes care of the terminating condition automatically (a function's base case won't trigger eval's special case for tail calls).


Progress
--------

It's definitely pre-beta quality software. I've been rapidly changing/adding features, so at any given point something might be broken. At the very least I try to make sure the built-in test scripts all work.

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
