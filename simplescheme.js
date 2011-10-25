/* 
 * simplescheme.js
 * Created by Mike Vollmer, 2011, licensed under GPL
 *
 * Called with the parse() function. Example:
 * parse('(define square (lambda (x) (* x x)))(square 5)')
 * => 25
 */

// Context objects contain all local variables plus the parent context
function Context()
{
  this.parent_context = null;
  this.vals = new Hash();
}

Context.prototype.add = function(key,val)
{
  this.vals[key] = val;
}

Context.prototype.find = function(key)
{
  found_val = this.vals[key];
  if (!found_val && found_val != 0)
  {
    if (!this.parent_context)
      return null;
    else // if not found locally, search upward
      return this.parent_context.find(key);
  } else
    return found_val;
}

// some primitive functions for testing
set_root = function()
{
  root_env = new Context();
  root_env.add('+', function(x,y) { return x+y });
  root_env.add('-', function(x,y) { return x-y });
  root_env.add('*', function(x,y) { return x*y });
  root_env.add('/', function(x,y) { return x/y });
  root_env.add('>', function(x,y) { return x>y });
  root_env.add('<', function(x,y) { return x<y });
  root_env.add('>=', function(x,y) { return x>=y });
  root_env.add('<=', function(x,y) { return x<=y });
  root_env.add('=', function(x,y) { return x==y });
  root_env.add('car', function(x) { return x[0] });
  root_env.add('cdr', function(x) { return x.slice(1) });
  root_env.add('cons', function(x,y) { y.splice(0,0,x); return y; });
  root_env.add('length', function(x) { return x.length });
  root_env.add('null?', function(x) { return (x.length < 1) });
  // a bunch of stuff from the standard library
  root_env.add('PI',Math.PI);
  root_env.add('abs',Math.abs);
  root_env.add('acos',Math.acos);
  root_env.add('asin',Math.asin);
  root_env.add('atan',Math.atan);
  root_env.add('ceil',Math.ceil);
  root_env.add('cos',Math.cos);
  root_env.add('exp',Math.exp);
  root_env.add('floor',Math.floor);
  root_env.add('log',Math.log);
  root_env.add('max',Math.max);
  root_env.add('min',Math.min);
  root_env.add('pow',Math.pow);
  root_env.add('random',Math.random); // this one definitely isn't purely functional
  root_env.add('sin',Math.sin);
  root_env.add('sqrt',Math.sqrt);
  root_env.add('tan',Math.tan);
  // true and false constants
  root_env.add('#f', false);
  root_env.add('#t', true);
  // the arguments object isn't really an array, even though it pretends to be,
  // so it has to be converted
  root_env.add('list', function () { return Array.prototype.slice.call(arguments) });
  // some boolean operations
  root_env.add('and',
      function ()
      {
        for (var i = 0; i < arguments.length; i++)
          if (!arguments[i]) return false;
        return true;
      }
  );
  root_env.add('or',
      function ()
      {
        for (var i = 0; i < arguments.length; i++)
          if (arguments[i]) return true;
        return false;
      }
  );
}

is_value = function(s)
{
  return (typeof(s) == 'number');
  // the typeof function in JS is confusing sometimes. at least it works
  // predictably for numbers (kind-of)
}

// eval function
// called with an expression and an optional environment (a Context object)
eval_l = function(x, env)
{
  if (!env) // if not set default to root_env
    env = root_env;
    
  // this is the heavy-hitter function. it goes through a bunch of possible cases
  // by comparing the value of the first item in the list. for example: if the first
  // item in the list is lambda, it creates a new function. if none of these cases is
  // true, it falls back on the base case: the first element in the list is a function
  // and the rest of the elements are arguments. if this also fails, eval_l throws an
  // error.
  if (is_value(x))
    return x; // just a number
  else if (env.find(x) || env.find(x) == 0) // otherwise the number 0 can't be stored
    return env.find(x); // a value in the context
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
      return eval_l(doexp, env);
    else
      return eval_l(elseexp, env);
  }
  else if (x[0] == 'cond')
  {
    var cond_exp = x.slice(1);
    if (cond_exp.length > 1)
    {
      generate_if = function(exp)
      {
        // tricky: this assumes that the last condition in cond will
        // always be true, if we get to it.
        if (exp.length == 1)
        {
          if (eval_l(exp[0][0]) == '#f') throw "Last condition on cond reached, no match.";
          return exp[0][1];
        } else 
        {
          // recursively build the if statement
          var current_exp = exp.shift();
          return ['if',current_exp[0],current_exp[1],generate_if(exp)];
        }
      }
      return eval_l(generate_if(cond_exp),env);
    } else throw 'Cond must have more than one conditions';
  }
  else if (x[0] == 'set!' || x[0] == 'define')
  {
    if (x.slice(1).length == 0) throw "Define and set! require one or more expressions";
    // edge case: defining a function
    if (x[0] == 'define' && typeof(x[1]) == 'object' && x[1].length > 1)
      return eval_l(['define',x[1][0],['lambda',x[1].slice(1),x[2]]],env);
    else if (x[0] == 'define' && x[2][0] == "lambda")
    {
      var new_func = build_function(x[2].slice(1),env);
      env.add(x[1],new_func);
    }
    else {
      // lazy hack: set! and define have identical behavior here
      env.add(x[1], eval_l(x[2],env));   
    }
  }
  else if (x[0] == 'lambda')
    return build_function(x.slice(1),env);
  else if (x[0] == 'begin')
  {
    // run a list of expressions in sequence and return the value returned by the last one
    var expressions = x.slice(1);
    if (expressions.length == 0) throw "Begin takes one or more expressions";
    var returned;
    for (var i = 0; i < expressions.length; i++)
      returned = eval_l(expressions[i],env);
    return returned;
  }
  else
  {
    // calling a procedure!
    var evaluated_elements = new Array(x.length);
    if (x.length > 1)
      for (var i = 0; i < x.length; i++) // eval each item in list
        evaluated_elements[i] = (eval_l(x[i],env));
    // call function with apply
    if (typeof(evaluated_elements[0]) == 'function')
    {
      // verify that it's a function, then apply it
      var returned_value = evaluated_elements[0].apply(null,evaluated_elements.slice(1));
      if (typeof(returned_value) == 'boolean')
        return (returned_value ? '#t' : '#f'); // returning actual true or false breaks stuff
      else
        return returned_value; // anything other than boolean can be returned directly
    } else // probably something wrong
      throw 'Not sure what to do with input \'' + x[0] + '\'';
  }
}

build_function = function(lambda_exp,env)
{
  // construct a new function by creating a local scope
  // and defining the passed values in it, then passing
  // that to eval
  if (lambda_exp.length < 2) throw "lambda takes two arguments";
  var params = lambda_exp[0];
  var exp = lambda_exp[1];
  var new_func = function()
  {
    var local_context = new Context();
    local_context.parent_context = env;
    for (i = 0; i < arguments.length; i++)
      local_context.add(params[i],arguments[i]);
    return eval_l(exp, local_context);
  }
  return new_func; // return higher order function
}

// logic for parsing a string of scheme code

find_matching_parenthesis = function(str)
{
  var p_count = 1;
  var index = 0; // assume first char is (
  while (p_count != 0 && index < str.length)
  {
    index++;
    if (str[index] == ')') p_count--;
    else if (str[index] == '(') p_count++;
  }
  // assume matching paren exists
  return index;
}

get_tokens = function(str)
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
  while (index < str.length)
  {
    if (str[index] == '(')
    {
      // match the parens and recurse
      var end_match = find_matching_parenthesis(str.substring(index)) + index;
      tokens.push(get_tokens(str.substring(index+1,end_match)));
      index = end_match;
    }
    else if (str[index] == ' ')
    {
      // time to add the buffers to the token array
      if (token_buf)
      {
        var new_token = token_buf;
        if (is_number(new_token))
          new_token = Number(new_token);
        tokens.push(new_token);
      }
      // reset the buffer
      token_buf = '';
    }
    else
    {
      token_buf = token_buf.concat(str[index]);
    }
    index++;
  }
  // add any remaining characters from the buffer
  if (token_buf)
  {
    var new_token = token_buf;
    if (is_number(new_token))
      new_token = Number(new_token);
    tokens.push(new_token);
  }
  // return the token array
  return tokens;
}

find_single_quotes = function(str)
{
  var index = 0;
  while (index < str.length)
  {
    if (str[index] == "'")
    {
      if (str[index+1] == "(" && str[index+2] == ")")
      {
        str = str.slice(0,index) +str.slice(index+1);
        str = str.slice(0,index+1) + 'quote' + str.slice(index+1);
      } else
      {
        str = str.slice(0,index) + str.slice(index+1);
        str = str.slice(0,index+1) + 'quote ' + str.slice(index+1);
      }
    }
    index++;
  }
  return str;
}

parse = function(str)
{
  set_root(); // clear environment on each parse
  // pass each statement to eval and return output
  var tokens;
  try {
    // preprocessing for input string
    tokens = get_tokens(find_single_quotes(str).replace(/;.*$|;.*[\n\r$]/g,'')
                                               .replace(/^\s+|\s+$/g, '')
                                               .replace(/(\r\n|\n|\r)/gm,""));
  } catch(e) { return e; }
  var output = [];
  for (var i = 0; i < tokens.length; i++)
  {
    var returned_value;
    // rudimentary error checking -- this try/catch block is mainly for catching
    // the javascript errors rather than sending them to FireBug
    try { returned_value = eval_l(tokens[i]); }
    catch(e) { returned_value = e; }
    // ignore statements that return nothing
    if (returned_value) output.push(returned_value);
  }
  return output; // array of output values
}

function is_number(n)
{
  // borrowed from the interwebs, crazy javascript hack
  return !isNaN(parseFloat(n)) && isFinite(n);
}
