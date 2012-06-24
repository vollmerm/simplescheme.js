/* 
 * simplescheme.js
 * Created by Mike Vollmer, 2011, licensed under GPL
 *
 * Called with the parse() function. Example:
 * require('simplescheme').parse('(define square (lambda (x) (* x x)))(square 5)')
 * => 25
 */
(function ()
{

  // Dealing with require() is kind-of a pain. 
  var Hash, Jsnum;
  if (typeof (window) === 'undefined')
  {
    Hash = require('./hash').Hash;
    Jsnum = require('./js-numbers.js');
  }
  else
  {
    Hash = require('hash').Hash;
    Jsnum = require('js-numbers');
  }

  var Proc = function Proc(args, exp, env)
  {
    // lambda functions are stored in Proc objects. I'm using these instead of
    // javascript functions (like I was previously) because these objects offer
    // direct access to the expressions and arguments of the function, which
    // I need for my tail recursion strategy. 
    this.args = args;
    this.exp = exp;
    this.env = env;
  };

  function is_proc(p)
  {
    // times like this I wish javascript's typeof operator wasn't as useless
    return p != null && p.constructor == Proc;
  }

  Proc.prototype.toString = function() { return "<Procedure>"; };

  var Pair = function Pair(car, cdr)
  {
    this.car = car;
    this.cdr = cdr;
  };

  function is_pair(p)
  {
    // checks if an object is a pair and *not* a list
    return p != null && p.constructor == Pair;
  }

  Pair.prototype.toString = function() { return "(" + this.car + " . " + this.cdr + ")"; };

  var root_env; // the root environment

  // Context objects contain all local variables plus the parent context
  var Context = function Context()
  {
    this.parent_context = null;
    this.vals = new Hash();
  };

  Context.prototype.add = function (key, val)
  {
    this.vals[key] = val;
  };

  Context.prototype.find = function (key)
  {
    found_val = this.vals[key];
    if (!found_val && found_val !== 0)
    {
      if (!this.parent_context)
      {
        return null;
      }
      else // if not found locally, search upward
      {
        return this.parent_context.find(key);
      }
    }
    else
    {
      return found_val;
    }
  };

  Context.prototype.set = function (key, val)
  {
    found_val = this.vals[key];
    if (!found_val && found_val !== 0)
    {
      if (!this.parent_context)
      {
        return false;
      }
      else // if not found locally, search upward
      {
        return this.parent_context.set(key, val);
      }
    }
    else
    {
      this.vals[key] = val;
      return true;
    }
  };

  function return_float(func)
  {
    return function()
    {
      return new_float(func.apply(null,arguments));
    };
  }
  
  function return_string(func)
  {
    return function()
    {
      return new_string(func.apply(null,arguments));
    };
  }
    
  function set_root()
  {
    // this huge function defines the root environment by adding a 
    // bunch of basic functions (mostly math related).
    root_env = new Context();
    root_env.add('+', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.add(x.data,y.data));
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data + y.data;
      }
      else throw "Expected two numbers.";
    });
    root_env.add('-', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.subtract(x.data,y.data));
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data - y.data;
      }
      else throw "Expected two numbers.";
    });
    root_env.add('*', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.multiply(x.data,y.data));
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data * y.data;
      }
      else throw "Expected two numbers.";
    });
    root_env.add('/', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.divide(x.data,y.data));
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data / y.data;
      }
      else throw "Expected two numbers.";
    });
    root_env.add('>', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return Jsnum.greaterThan(x.data,y.data);
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data > y.data;
      }
      else throw "Could not compare " + x + " and " + y;
    });
    root_env.add('<', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return Jsnum.lessThan(x.data,y.data);
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data < y.data;
      }
      else throw "Could not compare " + x + " and " + y;
    });
    root_env.add('>=', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return Jsnum.greaterThanOrEqual(x.data,y.data);
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data >= y.data;
      }
      else throw "Could not compare " + x + " and " + y;
    });
    root_env.add('<=', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return Jsnum.lessThanOrEqual(x.data,y.data);
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data <= y.data;
      }
      else throw "Could not compare " + x + " and " + y;
    });
    root_env.add('=', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return Jsnum.equals(x.data,y.data);
      }
      else if (is_typed_object(x) && is_typed_object(y))
      {
        return x.data == y.data;
      }
      else throw "Could not compare " + x + " and " + y;
    });
    root_env.add('%', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.modulo(x.data,y.data));
      }
      else throw "Expected two numbers";
    });
    root_env.add('modulo', function (x, y)
    {
      if (is_num(x) && is_num(y))
      {
        return new_num(Jsnum.modulo(x.data,y.data));
      }
      else throw "Expected two numbers";
    });
    root_env.add('pair?', function (x)
    {
      return (x != null && x.length > 0) || is_pair(x);
    });
    root_env.add('car', function (x)
    {
      if (x != null && x.length > 0)
      {
        if (x.length > 0)
        {
          return x[0];
        }
        else
        {
          throw "No car of empty list.";
        }
      }
      else if (is_pair(x))
      {
        return x.car;
      }
      else throw "Expected pair or list";
    });
    root_env.add('cdr', function (x)
    {
      if (x != null && x.length > 0)
      {
        if (x.length > 1)
        {
          return x.slice(1);
        }
        else
        {
          if (x.length == 0)
          {
            throw "No cdr of empty list.";
          }
          return [];
        }
      }
      else if (is_pair(x))
      {
        return x.cdr;
      }
      else throw "Expected pair or list";
    });
    root_env.add('cons', function (x, y)
    {
      if (y != null && y.length != null)
      {
        y.splice(0, 0, x);
        return y;
      }
      else
      {
        return new Pair(x,y);
      }
    });
    root_env.add('length', function (x)
    {
      return x.length;
    });
    root_env.add('null?', function (x)
    {
      return (!x || x.length < 1);
    });
    root_env.add('empty?', function (x)
    {
      return (!x || x.length < 1);
    });
    // a bunch of stuff from the standard library
    root_env.add('PI', new_num(Jsnum.pi));
    root_env.add('abs', function(x) {
      return new_num(Jsnum.abs(x.data));
    });
    root_env.add('acos',  function(x) {
      return new_num(Jsnum.acos(x.data));
    });
    root_env.add('asin',  function(x) {
      return new_num(Jsnum.asin(x.data));
    });
    root_env.add('atan', function(x) {
      return new_num(Jsnum.atan(x.data));
    });
    root_env.add('ceil', function(x) {
      return new_num(Jsnum.ceiling(x.data));
    });
    root_env.add('cos', function(x) {
      return new_num(Jsnum.cos(x.data));
    });
    root_env.add('exp', function(x,y) {
      return new_num(Jsnum.expt(x.data,y.data));
    });
    root_env.add('floor', function(x) {
      return new_num(Jsnum.floor(x.data));
    });
    root_env.add('log', function(x) {
      return new_num(Jsnum.log(x.data));
    });
    root_env.add('random', new_num(Jsnum.fromFixnum(Math.random)));
    root_env.add('sin',  function(x) {
      return new_num(Jsnum.sin(x.data));
    });
    root_env.add('sqrt',  function(x) {
      return new_num(Jsnum.sqrt(x.data));
    });
    root_env.add('tan',  function(x) {
      return new_num(Jsnum.tan(x.data));
    });
    // true and false constants
    root_env.add('#f', "#f");
    root_env.add('#t', "#t");
    // the arguments object isn't really an array, even though it pretends to be,
    // so it has to be converted
    root_env.add('list', function ()
    {
      return Array.prototype.slice.call(arguments);
    });
    // some boolean operations
    root_env.add('and', function ()
    {
      for (var i = 0; i < arguments.length; i++)
      if (!arguments[i] || arguments[i] == "#f") return false;
      return true;
    });
    root_env.add('or', function ()
    {
      for (var i = 0; i < arguments.length; i++)
      if (arguments[i] || arguments[i] == "#t") return true;
      return false;
    });
    root_env.add('string>?', function (x, y)
    {
      if (!is_string(x) || !is_string(y)) throw "expected string";
      else return x > y;
    });
    root_env.add('string<?', function (x, y)
    {
      if (!is_string(x) || !is_string(y)) throw "expected string";
      else return x < y;
    });
    root_env.add('string=?', function (x, y)
    {
      if (!is_string(x) || !is_string(y)) throw "expected string";
      else return x == y;
    });
    root_env.add('newline', function()
    {
      display_outputs.push("\n");
      return null;
    });
  }
	
	// Some simple built-in functions defined in Scheme.
	var builtins = "(define (map f l) (if (null? l) l (cons (f (car l)) (map f (cdr l)))))"
								 + "(define (filter f l) (if (null? l) l (if (f (car l)) (cons (car l) (filter f (cdr l))) (filter f (cdr l)))))"
								 + "(define (member x l) (if (null? l) #f (if (= x (car l)) #t (member x (cdr l)))))";

  // I'm running into the limits of the build-in Javascript types,
  // so I've started implementing my oen rudimentary type system.
	// Basically, it's just wrapping the variable in an object that
	// has a "type" parameter.

  function typed_object(type, data)
  {
    this.type = type;
    this.data = data;
  }

  typed_object.prototype.toString = function typed_to_string()
  {
    return "" + this.data;
  };
  
  function new_string(str)
  {
    return new typed_object("string", str);
  }

  function new_float(n)
  {
    return new typed_object("float", n);
  }

  function new_num(n)
  {
    return new typed_object("num", n);
  }

  function is_string(o)
  {
    return (typeof (o) == "object" && o.type == "string");
  }

  function is_float(o)
  {
    return (typeof (o) == "object" && o.type == "float");
  }

  function is_num(o)
  {
    return (typeof (o) == "object" && o.type == "num");
  }

  function is_function(o)
  {
    return (typeof (o) == "function");
  }

  function is_typed_object(o)
  {
    return o && (typeof (o) == "object" && o.type);
  }

  function is_value(s)
  {
    return (typeof (s) == 'number');
  }

  var display_outputs = []; // display and newline calls get put here
  // eval function
  // called with an expression, an optional environment (a Context object)
  // and a  flag for when eval is evaluating a parameter to a function
  function eval_l(x, env, in_param)
  {
    if (!env) // if not set default to root_env
    {
      env = root_env;
    }
    var lookup_value;
    while (true)
    {
      // if it's a variable. only look it up once
      lookup_value = env.find(x);
      

      // this is the heavy-hitter function. it goes through a bunch of possible cases
      // by comparing the value of the first item in the list. for example: if the first
      // item in the list is lambda, it creates a new function. if none of these cases is
      // true, it falls back on the base case: the first element in the list is a function
      // and the rest of the elements are arguments. if this also fails, eval_l throws an
      // error.
      if (is_typed_object(x))
      {
        return x; // just a number or string
      }
      else if ((lookup_value || lookup_value === 0) && // otherwise the number 0 can't be stored
               (typeof(lookup_value) != "function")) // don't match functions
      {
        return lookup_value; // a value in the context
      }
      else if (in_param && (lookup_value || lookup_value === 0) &&
               (typeof(lookup_value) == "function"))
      {
        return lookup_value; // a value in the context
      }
      else if (x[0] == 'quote')
      {
        return x[1];
      }
      else if (x[0] == 'if')
      {
        // if then else
        if (x.slice(1).length < 3) throw "if takes three arguments";
        var cond = x[1];
        var doexp = x[2];
        var elseexp = x[3];
        if (eval_l(cond, env) == '#t')
        {
          x = doexp;
        }
        else
        {
          // every if statement must have an else statement
          if (!elseexp) throw "No else condition or incomplete cond";
          x = elseexp;
        }
      }
      else if (x[0] == 'cond')
      {
        var cond_exp = x.slice(1);
        if (cond_exp.length > 1)
        {
          generate_if = function (exp)
          {
            var current_exp;
            if (exp.length == 1)
            {
              current_exp = exp[0];
              // return null if all conditions are false
              return ['if', current_exp[0], current_exp[1], null];
            }
            else
            {
              // recursively build the if statement
              current_exp = exp.shift();
              return ['if', current_exp[0], current_exp[1], generate_if(exp)];
            }
          };
          x = generate_if(cond_exp);
        }
        else throw 'Cond must have more than one conditions';
      }
      else if (x[0] == 'set!')
      {
        if (x.slice(1).length === 0) throw "set! requires one or more expressions";
        var evaled_param = eval_l(x[2],env);
        if (!env.set(x[1], evaled_param)) throw "set! cannot find " + x[1];
        return null;
      }
      else if (x[0] == 'define')
      {
        if (x.slice(1).length === 0) throw "Define requires one or more expressions";
        var exists = env.find(x[1]);
        if (exists || exists == 0) throw "Variable " + x[1] + " has already been defined.";
        // edge case: defining a function
        else if (typeof (x[1]) == 'object' && x[1].length > 0)
        {
          var new_lambda_exp = ['lambda', x[1].slice(1)];
          var exp_code = x.slice(2);
          for (var i = 0; i < exp_code.length; i++)
          {
            new_lambda_exp.push(exp_code[i]);
          }
          x = ['define', x[1][0],new_lambda_exp];
          // simple transformation to support function definition shortcut
        }
        env.add(x[1], eval_l(x[2], env));
        return null; // don't return anything
      }
      else if (x[0] == 'lambda')
      {
        // new: all functions are defined through lambda (ie: always anonymous)
        // since I'm no longer using the function name to detect tail recursion
        def_env = new Context();
        def_env.parent_context = env;
        return new Proc(x[1], x.slice(2), def_env);
      }
      else if (x[0] == 'let')
      {
        // simple transformation using lambda
        var pair_param = [];
        var pair_value = [];
        for (var i = 0; i < x[1].length; i++)
        {
          pair_param.push(x[1][i][0]);
          pair_value.push(x[1][i][1]);
        }
        var exp = [['lambda',pair_param,x[2]]];
        for (var i = 0; i < pair_value.length; i++)
        {
          exp.push(pair_value[i]);
        }
        x = exp;
      }
      else if (x[0] == 'begin')
      {
        // run a list of expressions in sequence and return the value returned by the last one
        var expressions = x.slice(1);
        if (expressions.length === 0) throw "Begin takes one or more expressions";
        // return run_sequence(expressions, env, null, false);
        for (var begin_index = 0; begin_index < expressions.length - 1; begin_index++)
        {
          eval_l(expressions[begin_index], env);
        }
        x = expressions.pop(); // don't run the last expression yet, may be tail recursion
      }
      else if (x[0] == 'display')
      {
        // this really should be moved up to root_env
        // it just uses my display buffer to print things
        if (x.slice(1).length > 1) throw "display takes one argument";
        if (is_typed_object(x[1]))
        {
          display_outputs.push(x[1].data);
        }
        else
        {
          var to_display = eval_l(x[1], env);
          if (is_typed_object(to_display))
          {
            display_outputs.push(to_display.data);
          }
          else 
          {
            display_outputs.push(to_display);
          }
        }
        return null;
      }
      else
      {
        // calling a procedure!
        var evaluated_elements = new Array(x.length);
        if (typeof (x) == "object" && x.length > 0)
        {
          // if it's a function stored as a variable we want to look it up
          // this fixes a bug in running functions that take no arguments
          var func = env.find(x[0]);
          if (func && typeof(func) == "function")
          {
            evaluated_elements[0] = func;
          }
          else
          {
            evaluated_elements[0] = eval_l(x[0],env);
          }
          for (var j = 1; j < x.length; j++) // eval each item in list
          {
            evaluated_elements[j] = eval_l(x[j], env, true);
          }
        }
        // call function with apply
        if (typeof (evaluated_elements[0]) == 'function')
        {
          // verify that it's a function, then apply it
          // this only works for javascript functions (ie: built-in ones) and not
          // for user-defined functions
          // also note that javascript functions are not tail-recursive, so any
          // function applied this way ignores tail recursion
          var operands = evaluated_elements.slice(1);
          var returned_value = evaluated_elements[0].apply(null, operands);
          if (typeof (returned_value) == 'boolean')
          {
            return (returned_value ? '#t' : '#f'); // returning actual true or false breaks stuff
          }
          else
          {
            return returned_value; // anything other than boolean can be returned directly
          }
        }
        else if (is_proc(evaluated_elements[0]))
        {
          // this is a user-defined function!
          // in order to support tail recursion, we can't just recursively call
          // eval_l here. doing so would grow the stack. so, x and env are set to
          // the expression and environment from the Proc object and eval_l loops
          // as normal.
          env = new Context();
          env.parent_context = evaluated_elements[0].env;
          var args = evaluated_elements.slice(1);
          if (args.length != evaluated_elements[0].args.length)
          {
            throw "Argument list lengths don't match for " + evaluated_elements[0];
          }
          for (var arg_index = 0; arg_index < args.length; arg_index++)
          {
            env.add(evaluated_elements[0].args[arg_index], args[arg_index]);
          }
          x = [];
          var new_exp = evaluated_elements[0].exp;
          if (new_exp.length > 1)
          {
            // things get tricky here. I'm still not convinced I did this right.
            // the problem is that some function definitions have multiple lists
            // in them, while some only have one. if there are multiple, we need
            // to run them all and return the output of the last expression. one
            // simple way to do that is with begin. 
            for (var elm_index = 0; elm_index < new_exp.length; elm_index++)
            {
              x.push(new_exp[elm_index]);
            }
            x.unshift("begin");
          }
          else
          {
            x = new_exp[0]; // the expression is in [0] of Proc.exp
          }
        }
        else
        { 
          // probably something wrong, try to report basic error info
          if (typeof(x) == "string")
          {
            throw "unable to determine what " + x + " is.";
          }
          else
          {
            throw 'Not sure what to do with ' + evaluated_elements
              + " ("+evaluated_elements.length+")";
          }
        }
      }
    }
    return null;
  }

  function print_helper(str, exp)
  {
    console.log(str + ":");
    console.log(exp);
  }

  function print_exp(exps)
  {
    // I don't know why I didn't build this earlier. this function makes
    // debugging much easier. for some reason javascript often sucks at
    // printing readable structures to the console
    if (exps != null && exps.length > 0)
    {
      var exp = exps.slice(0);
      if (typeof (exp) == "object" && exp.length > 1)
      {
        for (var i = 0; i < exp.length; i++)
        {
          if (is_typed_object(exp[i]))
          {
            exp[i] = exp[i].data;
          }
        }
      }
      console.log(exp);
    }
    else
    {
      console.log(exps);
    }
  }

  function remove_comments(str)
  {
    // scan the source string for comments
    return str.replace(/;.*$|;.*[\n\r$]/g, '')
              .replace(/^\s+|\s+$/g, '')
              .replace(/(\r\n|\n|\r)/gm, '');
  }

  function recursive_descent(str)
  {
    // recursive descent parser: parse the source string 
    // and return the abstract syntax tree
    var ptr = 0;
    var ast = [];
    str = remove_comments(str);

    function match(c)
    {
      if (c == str.charAt(ptr)) { ptr++; }
      else { throw "Parse error at " + str.charaAt(ptr); }
    }

    function char_is_letter()
    {
      var c = str.charAt(ptr).toLowerCase();
      return (c >= 'a' && c <= 'z');
    }

    function char_is_number()
    {
      var c = str.charAt(ptr);
      return (c >= '0' && c <= '9');
    }

    function char_is_symbol()
    {
      // allowed symbols
      var c = str.charAt(ptr);
      return (c == "+" || c == "-" ||
              c == "=" || c == "*" ||
              c == "!" || c == "#" ||
              c == "&" || c == "_" ||
              c == "?" || c == "/" ||
              c == "<" || c == ">" ||
              c == "," || c == ".");
    }

    function atom()
    {
      var buf = "";
      if (char_is_letter() || char_is_symbol()) 
      {
        // atoms cannot start with a number
        buf += str.charAt(ptr);
        match(str.charAt(ptr));
      }
      else { throw "parse error"; }
      while (char_is_letter() || char_is_number() ||
             char_is_symbol())
      {
        buf += str.charAt(ptr);
        match(str.charAt(ptr));
      }
      return buf;
    }

    function escape_char()
    {
      match("\\");
      var c = str.charAt(ptr);
      match(c);
      return c;
    }
    function str_literal()
    {
      var buf = "";
      match("\"");
      while (str.charAt(ptr) != "\"")
      {
        if (str.charAt(ptr) == "\\")
        {
          buf += escape_char();
        }
        else
        {
          buf += str.charAt(ptr);
          match(str.charAt(ptr));
        }
      }
      match("\"");
      return new_string(buf);
    }
    function num()
    {
      var buf = "";
      if (str.charAt(ptr) == '-') { 
        buf += '-'; 
        match('-');
      }
      while (char_is_number() || str.charAt(ptr) == '.')
      {
        buf += str.charAt(ptr);
        match(str.charAt(ptr));
      }
      return new_num(Jsnum.fromString(buf));
    }
    function whitespace()
    {
      while (str.charAt(ptr) == " " ||
             str.charAt(ptr) == "\n" ||
             str.charAt(ptr) == "\t")
      {
        match(str.charAt(ptr));
      }
    }
    function quote_symbol()
    {
      var sublist = ["quote"];
      match("'");
      if (str.charAt(ptr) == "(")
      {
        sublist.push(parse_list());
      }
      else if (char_is_number())
      {
        sublist.push(num());
      }
      else if (char_is_letter() || char_is_symbol())
      {
        sublist.push(atom());
      }
      else { throw "Parse error at '"; }
      return sublist;
    }
    function parse_list()
    {
      var sublist = [];
      whitespace();
      match('(');
      while (str.charAt(ptr) != ')')
      {
        whitespace();
        if (str.charAt(ptr) == "(")
        {
          sublist.push(parse_list());
        }
        else if (str.charAt(ptr) == "'")
        {
          sublist.push(quote_symbol());
        }
        else if (str.charAt(ptr) == "\"")
        {
          sublist.push(str_literal());
        }
        else if (char_is_number() || str.charAt(ptr) == "-")
        {
          sublist.push(num());
        }
        else if (char_is_letter() || char_is_symbol())
        {
          sublist.push(atom());
        }
        else if (str.charAt(ptr) == ")")
        {
          continue;
        }
        else { throw "Parse error at " + str.charAt(ptr); }
        }
      match(')');
      return sublist;
    }
    function decide()
    {
      whitespace();
      if (str.charAt(ptr) == "(")
      {
        return parse_list();
      }
      else if (str.charAt(ptr) == "'")
      {
        return quote_symbol();
      }
      else if (str.charAt(ptr) == "\"")
      {
        return str_literal();
      }
      else if (char_is_number() || str.charAt(ptr) == "-")
      {
        return num();
      }
      else if (char_is_letter() || char_is_symbol())
      {
        return atom();
      }
      else
      {
        throw "Parse error at " + ptr + " on " + str.charAt(ptr);
      }
    }
    while (ptr < str.length)
    {
      ast.push(decide());
    }
    return ast;
  } 

  function parse(str, debug)
  {
    if (!str) throw "Input is empty!";
    set_root(); // clear environment on each parse    
    str = builtins + str; // add builtins
    var tokens = recursive_descent(str); // parse string
    var output = []; // place to store output used below
    for (var i = 0; i < tokens.length; i++)
    {
      display_outputs = []; // reset this var (defined above!); side-effects from display and newline go here
      var returned_value;
      function parse_process()
      {
        returned_value = eval_l(tokens[i]); // eval the code!
        var output_string = "";
        if (display_outputs != null && display_outputs.length > 0) 
        {
          output_string += print_list(display_outputs,true);
        }
        if (returned_value != null)
        {
          output_string += print_list(returned_value,false);
          output_string += "\n"; // put new line after returned values
        }
        output.push(output_string);
      }
      if (!debug)
      {
	      // not debug mode, so capture exceptions
        try
        {
          parse_process();
        }
        catch (e)
        {
          return [e];
        }
      }
      else
      {
	      // propogate exceptions up out of interpreter
        parse_process();
      }
    }
    return output.join(''); // array of output values
  }


  function print_list(list, formatted)
  {
    var str = "";
    if (typeof(list) == "object" && list.length != null)
    {
      if (!formatted) { str += "("; }
      for (var i = 0; i < list.length; i++)
      {
        str += format_str(list[i]);
        if (i != list.length - 1 && !formatted)
        {
          str += " ";
        }
      }
      if (!formatted) { str += ")"; }
    }
    else
    {
      str = format_str(list);
    }
    if (formatted)
    {
      return str;
    }
    else
    {
      return str;
    }
  }
  function format_str(s)
  {
    var str = "";
    if (typeof(s) == "number" || typeof(s) == "string")
    {
      str += s + "";
    }
    else if (typeof(s) == "object" && is_typed_object(s))
    {
      str += s.data + "";
    }
    else if (typeof(s) == "object" && s.length != null)
    {
      str += print_list(s,false);
    }
    else
    {
      str += "" + s;
    }
    return str;
  }


  exports.parse = parse;
  exports.eval_l = eval_l;
  exports.print_list = print_list;
  exports.recursive_descent = recursive_descent;

}());
