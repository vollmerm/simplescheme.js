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
	if (!found_val)
	{
		if (!this.parent_context)
			return null;
		else // if not found locally, search upward
			return this.parent_context.find(key);
	}	else
		return found_val;
}

// some primitive functions for testing
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
root_env.add('length', function(x) { x.length });
root_env.add('null?', function(x) { x == null });

is_value = function(s)
{
	return (typeof(s) == 'number');
	// the typeof function in JS is confusing sometimes. at least it works
	// predictably for numbers (kind-of)
}

// eval function
// called with an expression and an optional environment (a Context object)
eval = function(x, env)
{
	if (!env) // if not set default to root_env
		env = root_env;
	if (is_value(x))
		return x; // just a number
	else if (val = env.find(x))
		return val; // a value in the context
	else if (x[0] == 'quote')
		return x.slice(1); // quoted value or list
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
			return eval(exp, local_context);
		}
		return new_func; // return higher order function
	}
	else if (x[0] == 'if')
	{
		// if then else
		var cond = x[1];
		var doexp = x[2];
		var elseexp = x[3];
		if (eval(cond, env))
			return eval(doexp, env);
		else
			return eval(elseexp, env);
	}
	else if (x[0] == 'set!' || x[0] == 'define')
	{
		// lazy hack: set! and define have identical behavior here
		env.add(x[1], eval(x[2],env));
	}

	else if (x[0] == 'begin')
	{
		// evaluates all expressions then returns the last one
		if (x[1].length == 1)
			return eval(x[1],env);
		before_end = x[1].slice(0,-1);
		for (i = 0; i < before_end.length; i++)
			eval(before_end[i], env);
		return eval(x[1][x[1].length-1],env);
	}
	else
	{
		// calling a procedure!
		var evaluated_elements = new Array(x.length);
		for (var i = 0; i < x.length; i++) // eval each item in list
			evaluated_elements[i] = (eval(x[i],env));
		// call function with apply
		// this would be a good place to try to catch errors if
		// I weren't so lazy
		return evaluated_elements[0].apply(null,evaluated_elements.slice(1));
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
	var number_buf = null;
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
			  tokens.push(token_buf);
			else if (number_buf)
				tokens.push(number_buf);
			token_buf = '';
			number_buf = null;
		}
		else
		{
			if (is_number(str[index]))
			{
				if (number_buf == null) number_buf = 0;
				number_buf = (number_buf * 10) + Number(str[index]);
			} else 
				token_buf = token_buf.concat(str[index]);
		}
		index++;
	}
	// add any remaining characters from the buffer
	if (token_buf)
		tokens.push(token_buf);
	else if (number_buf)
		tokens.push(number_buf);
	// return the token array
	return tokens;
}

parse = function(str)
{
	// pass each statement to eval and return output
	var tokens = get_tokens(str);
	var output = [];
	for (var i = 0; i < tokens.length; i++)
	{
		var returned_value = eval(tokens[i]);
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

