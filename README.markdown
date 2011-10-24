simplescheme.js
===============

This is a very simple LISP interpreter implemented in Javascript. I started working on this for fun and to help me study for my programming languages class.

Usage
-----

Pass LISP code to the parse() function to eval it, or pass LISP-like code in Javascript array form to the eval function directly.

Implementation details
----------------------

simplescheme.js is primarily built around a single eval() function. It takes two parameters: an expression (in the form of a Javascript array) and an environment (in the form of a Context object). Context objects use a hash table for local values and variables, and a linked list in the form of Context.parent_context links a Context object to its parent(s). This way, an attempt to look up a given value will first check the immediate or local context, then check the one directly above it, and so on, all the way back down to the global context.

Javascript supports higher order functions, which greatly simplified the implementation of LISP's lambda functions. To create a lambda function, I created a Javascript function that defined a new context (where the arguments are mapped to the function signature's parameters and added to the local context) and passes it to eval along with its expression.

Eval has a few base cases (if statement, define, lambda, self-evaluating value, etc). If none of these are the case, then it assumes that the expression is in the form of (function *parameters) and attempts to call it. If you get a weird Javascript error about apply not being a valid function, it's probably because you passed a list to eval that it didn't understand, so it tried to call the first element as a function.

Progress
--------

The built-in functions are fairly limited. The standards (cons, car, cdr, if, +, -, =, quote, etc) _are_ implemented, as well as lambda functions.

Currently there is no error checking. Numbers are the only supported type. Single-quote shortcut for quotes and (define (f x)) syntax for functions are both not implemented. No tail recursion, no call. Also it's probably buggy. Sounds great, right?

Extending
---------

Adding new primitive functions is fairly simple -- javascript functions can be inserted directly into the global scope by calling root_env.add(name,function).
