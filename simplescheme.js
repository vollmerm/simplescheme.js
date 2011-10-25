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
        {
          if (!arguments[i]) return false;
        }
        return true;
      }
  );
  root_env.add('or',
      function ()
      {
        for (var i = 0; i < arguments.length; i++)
        {
          if (arguments[i]) return true;
        }
        return false;
      }
  )
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
  if (is_value(x))
    return x; // just a number
  else if (env.find(x) || env.find(x) == 0) // otherwise the number 0 can't be stored
    return env.find(x); // a value in the context
  else if (x[0] == 'quote')
  {
    if (!x.slice(1)) return [];
    else return x.slice(1); // quoted value or list
  }
  else if (x[0] == 'lambda')
  {
    // construct a new function by creating a local scope
    // and defining the passed values in it, then passing
    // that to eval
    var new_func = function()
    {
      var lambda_exp = x.slice(1);
      var params = lambda_exp[0];
      var exp = lambda_exp[1];
      var local_context = new Context();
      local_context.parent_context = env;
      for (i = 0; i < arguments.length; i++)
        local_context.add(params[i],arguments[i]);
      return eval_l(exp, local_context);
    }
    return new_func; // return higher order function
  }
  else if (x[0] == 'if')
  {
    // if then else
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
        if (exp.length == 1) return ['if',exp[0][0],exp[0][1]];
        else 
        {
          var current_exp = exp.shift();
          return ['if',current_exp[0],current_exp[1],generate_if(exp)];
        }
      }
      return eval_l(generate_if(cond_exp));
    } else throw 'Cond must have more than one conditions';
  }
  else if (x[0] == 'set!' || x[0] == 'define')
  {
    // lazy hack: set! and define have identical behavior here
    env.add(x[1], eval_l(x[2],env));
  }

  else if (x[0] == 'begin')
  {
    // evaluates all expressions then returns the last one
    if (x[1].length == 1)
      return eval_l(x[1],env);
    before_end = x[1].slice(0,-1);
    for (i = 0; i < before_end.length; i++)
      eval_l(before_end[i], env);
    return eval_l(x[1][x[1].length-1],env);
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
      var returned_value = evaluated_elements[0].apply(null,evaluated_elements.slice(1));
      if (typeof(returned_value) == 'boolean')
        return (returned_value ? '#t' : '#f');
      else
        return returned_value;
    } else // probably something wrong
      throw 'Not sure what to do with input \'' + x[0] + '\'';
  }
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
      token_buf = '';
      number_buf = null;
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

parse = function(str)
{
  set_root();
  // pass each statement to eval and return output
  var tokens;
  try {
    tokens = get_tokens(str.replace(/;.*$|;.*[\n\r$]/g,'').replace(/^\s+|\s+$/g, '').replace(/(\r\n|\n|\r)/gm,""));
  } catch(e) { return e; }
  var output = [];
  for (var i = 0; i < tokens.length; i++)
  {
    var returned_value;
    try { returned_value = eval_l(tokens[i]); }
    catch(e) { returned_value = e; }
    // ignore statements that return nothing
    if (returned_value) output.push(returned_value);
  }
  return output;
}

function is_number(n)
{
  // borrowed from the interwebs, crazy javascript hack
  return !isNaN(parseFloat(n)) && isFinite(n);
}
