/* 
 * simplescheme.js
 * Created by Mike Vollmer, 2011, licensed under GPL
 *
 * Called with the parse() function. Example:
 * SScheme.parse('(define square (lambda (x) (* x x)))(square 5)')
 * => 25
 */
(function ()
{

  // Dealing with require() is kind-of a pain. 
  var Hash;
  if (typeof (window) === 'undefined')
  {
    Hash = require('./hash').Hash;
  }
  else
  {
    // Try looking for it in the current directory
    try
    {
      Hash = require('hash').Hash;
    }
    catch (e)
    {
      // If that fails, it's probably here
      Hash = require('lib/hash').Hash;
    }
  }
  
  var root_env; // the root environment

  // Context objects contain all local variables plus the parent context
  var Context = function Context()
    {
      this.parent_context = null;
      this.vals = new Hash();
    }

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
  
  function return_float(func)
  {
    return function()
    {
      return new_float(func.apply(null,arguments));
    }
  }
  
  function return_string(func)
  {
    return function()
    {
      return new_string(func.apply(null,arguments));
    }
  }

  // some primitive functions for testing
  var set_root = function set_root()
    {
      // I need to fix some of these functions to properly handle types
      // They currently don't recieve typed objects but are expected to
      // return them. That's probably a bad idea in the long run.
      root_env = new Context();
      root_env.add('+', function (x, y)
      {
        return new_float(x + y);
      });
      root_env.add('-', function (x, y)
      {
        return new_float(x - y);
      });
      root_env.add('*', function (x, y)
      {
        return new_float(x * y);
      });
      root_env.add('/', function (x, y)
      {
        return new_float(x / y);
      });
      root_env.add('>', function (x, y)
      {
        return x > y;
      });
      root_env.add('<', function (x, y)
      {
        return x < y;
      });
      root_env.add('>=', function (x, y)
      {
        return x >= y;
      });
      root_env.add('<=', function (x, y)
      {
        return x <= y;
      });
      root_env.add('=', function (x, y)
      {
        return x == y;
      });
      root_env.add('%', function (x, y)
      {
        return new_float(x % y);
      });
      root_env.add('modulo', function (x, y)
      {
        return new_float(x % y);
      });
      root_env.add('car', function (x)
      {
        return x[0];
      });
      root_env.add('cdr', function (x)
      {
        return x.slice(1);
      });
      root_env.add('cons', function (x, y)
      {
        y.splice(0, 0, x);
        return y;
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
      root_env.add('PI', new_float(Math.PI));
      root_env.add('abs', return_float(Math.abs));
      root_env.add('acos', return_float(Math.acos));
      root_env.add('asin', return_float(Math.asin));
      root_env.add('atan', return_float(Math.atan));
      root_env.add('ceil', return_float(Math.ceil));
      root_env.add('cos', return_float(Math.cos));
      root_env.add('exp', return_float(Math.exp));
      root_env.add('floor', return_float(Math.floor));
      root_env.add('log', return_float(Math.log));
      root_env.add('max', return_float(Math.max));
      root_env.add('min', return_float(Math.min));
      root_env.add('pow', return_float(Math.pow));
      root_env.add('random', return_float(Math.random)); // this one definitely isn't purely functional
      root_env.add('sin', return_float(Math.sin));
      root_env.add('sqrt', return_float(Math.sqrt));
      root_env.add('tan', return_float(Math.tan));
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
        if (typeof (x) != "string" || typeof (y) != "string") throw "expected string";
        else return x > y;
      });
      root_env.add('string<?', function (x, y)
      {
        if (typeof (x) != "string" || typeof (y) != "string") throw "expected string";
        else return x < y;
      });
      root_env.add('string=?', function (x, y)
      {
        if (typeof (x) != "string" || typeof (y) != "string") throw "expected string";
        else return x == y;
      });
    }

    // I'm running into the limits of the build-in Javascript types,
    // so I've started implementing my oen rudimentary type system.
    // Basically, it's just wrapping the variable in an object that
    // has a "type" parameter.

  function typed_object(type, data)
  {
    this.type = type;
    this.data = data;
  }


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

  // Because javascript doesn't have proper support for tail-recursion
  // I need some way of optimizing tail calls in Scheme into a loop.
  // Rather than attempt to detect tail refursive functions by
  // analyzing the code, I decided to build a special case into eval_l and
  // run_sequence that will execute tail calls as a series of eval_l calls
  // rather than nested eval_l calls.
  // To do this, I have eval_l keep track of the function that called it,
  // and if it encounters an instruction to run that function again it returns
  // a special object to run_sequence indicating that function is tail-recursive.
  var Tail_call = function Tail_call(func, ops)
    {
      this.func = func;
      this.ops = ops;
    }

  function is_tail_call_indicator(o)
  {
    return (typeof (o) == "object" && o.func);
  }

  var display_outputs = []; // display and newline calls get put here
  // eval function
  // called with an expression, an optional environment (a Context object)
  // and an optional caller (function name) for detecting tail calls
  var eval_l = function eval_l(x, env, caller)
    {
      if (!env) // if not set default to root_env
      env = root_env;

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
      else if (env.find(x) || env.find(x) === 0) // otherwise the number 0 can't be stored
      {
        return env.find(x); // a value in the context
      }
      else if (x[0] == 'quote')
      {
        if (!x.slice(1)) return []; // empty list
        else return x.slice(1); // quoted value or list
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
          return eval_l(doexp, env, caller);
        }
        else
        {
          // every if statement must have an else statement
          if (!elseexp) throw "No else condition or incomplete cond";
          return eval_l(elseexp, env, caller);
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
          return eval_l(generate_if(cond_exp), env, caller);
        }
        else throw 'Cond must have more than one conditions';
      }
      else if (x[0] == 'set!' || x[0] == 'define')
      {
        if (x.slice(1).length === 0) throw "Define and set! require one or more expressions";
        // edge case: defining a function
        if (x[0] == 'define' && typeof (x[1]) == 'object' && x[1].length > 1 && x.length < 4)
        {
          return eval_l(['define', x[1][0],
            ['lambda', x[1].slice(1), x[2]]
          ], env);
        }
        else if (x[0] == 'define' && typeof (x[1]) == 'object' && x[1].length > 1 && x.length >= 4)
        {
          return eval_l(['define', x[1][0],
            ['lambda', x[1].slice(1), x.slice(2)]
          ], env);
        }
        else if (x[0] == 'define' && x[2][0] == "lambda")
        {
          var new_func = build_function(x[2].slice(1), env, x[1]);
          env.add(x[1], new_func);
        }
        else
        {
          // lazy hack: set! and define have identical behavior here
          env.add(x[1], eval_l(x[2], env));
        }
        return null; // don't return anything
      }
      else if (x[0] == 'lambda') return build_function(x.slice(1), env, null); // anonymous function
      else if (x[0] == 'begin')
      {
        // run a list of expressions in sequence and return the value returned by the last one
        var expressions = x.slice(1);
        if (expressions.length === 0) throw "Begin takes one or more expressions";
        // currently expressions wrapped in begin cannot be tail recursive.
        // the solution here would probably be to make sure the tail call logic doesn't
        // kick in unless it's the _last_ statement in the begin.
        return run_sequence(expressions, env, null, false);
      }
      else if (x[0] == 'display')
      {
        // I don't need display or newline inside the eval. Sometime soon I'll get
        // around to moving them out and into functions of their own.
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
        return null; // 100% side effect function, returns nothing
      }
      else if (x[0] == 'newline')
      {
        // see above comment for display
        if (x.slice(1) > 1) throw "newline takes no arguments";
        else display_outputs.push("\n");
        return null;
      }
      else
      {
        // calling a procedure!
        var evaluated_elements = new Array(x.length);

        if (x.length > 1 && typeof (x) == "object")
        {
          // first check for tail call
          if (caller && x[0] == caller)
          {
            // I could probably clean this section up a bit...
            // the two branches have very similar loops
            for (var j = 0; j < x.length; j++)
            {
              evaluated_elements[j] = eval_l(x[j], env);
            }
            return new Tail_call(evaluated_elements[0], evaluated_elements.slice(1));
          }
          else
          {
            for (var j = 0; j < x.length; j++) // eval each item in list
            {
              evaluated_elements[j] = eval_l(x[j], env, null);
              if (is_typed_object(evaluated_elements[j]))
              {
                evaluated_elements[j] = evaluated_elements[j].data;
              }
            }
          }
        }
        // call function with apply
        if (typeof (evaluated_elements[0]) == 'function')
        {
          // verify that it's a function, then apply it
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
        else
        { // probably something wrong
          throw 'Not sure what to do with input \'' + x[0] + '\' \n from ' + x;
        }
      }
      return null;
    }

  function build_function(lambda_exp, env, name)
  {
    name = name || null;
    // construct a new function by creating a local scope
    // and defining the passed values in it, then passing
    // that to eval
    if (lambda_exp.length < 2) throw "lambda takes two arguments";
    var params = lambda_exp[0];
    var exp = lambda_exp[1];
    var local_context;
    var new_func = function ()
      {
        local_context = new Context();
        local_context.parent_context = env;
        // The function needs to somehow inform run_sequence
        // whether it has been called by a tail-call already or not. If
        // it hasn't, run_sequence will attempt to check for tail recursion.
        var tail = false;
        for (i = 0; i < arguments.length; i++)
        {
          if (i == arguments.length - 1 && !params[i] &&
              is_tail_call_indicator(arguments[i]))
          {
            tail = true;
          }
          else
          {
            // add passed parameters to the local environment
            local_context.add(params[i], arguments[i]);
          }
        }
        return run_sequence(exp, local_context, name, tail);
      };
    return new_func; // return higher order function
  }

  function run_sequence(exp_list, env, caller, tail)
  {
    if (exp_list && (typeof (exp_list) == "object") &&
                    (typeof (exp_list[0]) == "object"))
    {
      // a series of expressions
      var ret; // value to return
      // I'm making a copy of the expression list because I'm going to modify it
      var exp_stack = exp_list.slice(0).reverse(); // treat expression list as stack
      var current_exp;
      var new_exp;
      while (exp_stack.length > 0)
      {
        current_exp = exp_stack.pop();
        ret = eval_l(current_exp, env, caller);
        // if we're already in the middle of a tail call loop, we want to 
        // send the returned Tail_call object down the stack. We don't want
        // to start another loop here.
        while (ret && !tail && is_tail_call_indicator(ret))
        {
          // keep calling this (tail-recursive) function until we hit
          // the termination case
          var ops = ret.ops;
          // tell the function that it was called from a tail call
          ops.push(ret);
          ret = ret.func.apply(null, ops);
        }
      }
      return ret;
    }
    else if (exp_list && (typeof (exp_list) == "object") && (typeof (exp_list[0]) != "object"))
    {
      return run_sequence([exp_list], env, caller, tail); // not really a sequence
    }
  }

  function print_helper(str, exp)
  {
    console.log(str + ":");
    console.log(exp);
  }

  function print_exp(exps)
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

  // logic for parsing a string of scheme code

  function find_matching_parenthesis(str)
  {
    var p_count = 1;
    var index = 0; // assume first char is (
    while (p_count !== 0 && index < str.length)
    {
      index++;
      if (str[index] == ')')
      {
        p_count--;
      }
      else if (str[index] == '(')
      {
        p_count++;
      }
    }
    // assume matching paren exists
    return index;
  }


  function is_number(n)
  {
    // borrowed from the interwebs, crazy javascript hack
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function get_tokens(str)
  {
    // recursively generate arrays of tokens by looking
    // for nested parenthesis
    var index = 0;
    var tokens = [];
    // some of the input will obviously consist of more than a single
    // character, so I had to somehow construct strings/numbers in the
    // token array despite processing the string character by character.
    // I'm sure there are lots of better solutions out there but this was
    // the first that popped into my head: I create a buffer and add characters
    // to it until I hit whitespace or the end of the string.
    var token_buf = '';
    // don't build token if we're inside a quote
    var in_quote = false;
    while (index < str.length)
    {
      if (!in_quote && str[index] == '(')
      {
        // match the parens and recurse
        var end_match = find_matching_parenthesis(str.substring(index)) + index;
        tokens.push(get_tokens(str.substring(index + 1, end_match)));
        index = end_match;
      }
      else if (str[index] == ' ' && !in_quote)
      {
        // time to add the buffers to the token array
        if (token_buf)
        {
          tokens.push(build_token(token_buf));
        }
        // reset the buffer
        token_buf = '';
      }
      else
      {
        if (!in_quote && str[index] == "\"")
        {
          in_quote = true;
        }
        else if (in_quote && str[index] == "\"")
        {
          in_quote = false;
        }
        token_buf = token_buf.concat(str[index]);
      }
      index++;
    }
    // add any remaining characters from the buffer
    if (token_buf)
    {
      tokens.push(build_token(token_buf));
    }
    // return the token array
    return tokens;
  }

  function build_token(s)
  {
    var new_token = s;
    if (is_number(new_token)) new_token = new_float(Number(new_token));
    else if (new_token[0] == "\"" && new_token[new_token.length - 1] == "\"")
    {
      new_token = new_token.slice(1, new_token.length - 1);
      var internal_quote = new_token.indexOf("\"");
      if (internal_quote != -1 && new_token[internal_quote - 1] != "\\")
      {
        throw "Premature end of string or unescaped quotes";
      }
      new_token = new_string(new_token);
    }
    return new_token;
  }

  function find_single_quotes(str)
  {
    var index = 0;
    while (index < str.length)
    {
      if (str[index] == "'")
      {
        if (str[index + 1] == "(" && str[index + 2] == ")")
        {
          str = str.slice(0, index) + str.slice(index + 1);
          str = str.slice(0, index + 1) + 'quote' + str.slice(index + 1);
        }
        else
        {
          str = str.slice(0, index) + str.slice(index + 1);
          str = str.slice(0, index + 1) + 'quote ' + str.slice(index + 1);
        }
      }
      index++;
    }
    return str;
  }

  var parse = function parse(str)
    {
      if (!str) throw "Input is empty!";
      set_root(); // clear environment on each parse
      // pass each statement to eval and return output
      var tokens;
      try
      {
        // preprocessing for input string
        tokens = get_tokens(find_single_quotes(str).replace(/;.*$|;.*[\n\r$]/g, '')
                                                   .replace(/^\s+|\s+$/g, '')
                                                   .replace(/(\r\n|\n|\r)/gm, ''));
      }
      catch (e)
      {
        return e;
      }
      var output = [];
      for (var i = 0; i < tokens.length; i++)
      {
        display_outputs = [];
        var returned_value;
        // rudimentary error checking -- this try/catch block is mainly for catching
        // the javascript errors rather than sending them to FireBug
        try
        {
          returned_value = eval_l(tokens[i]);
          var display_outputs_copy = display_outputs.slice(0);
          var output_string = "";
          if (display_outputs_copy.length > 0)
          {
            for (var j = 0; j < display_outputs_copy.length; j++)
            {
              output_string += display_outputs_copy[j];
            }
          }
          if (is_typed_object(returned_value))
          {
            returned_value = returned_value.data;
          }
          // ignore statements that return nothing
          if (returned_value)
          {
            output.push(output_string.concat(
              (typeof (returned_value) == "object" &&
               returned_value.length > 1 ?
                  returned_value.join(", ") : returned_value)));
          }
          else if (output_string)
          {
            output.push(output_string);
          }
        }
        catch (e)
        {
          return [e];
        }
      }
      return output; // array of output values
    }

  exports.parse = parse;
  exports.eval_l = eval_l;

}());