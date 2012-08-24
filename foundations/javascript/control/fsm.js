// @@@LICENSE
//
//      Copyright (c) 2009-2012 Hewlett-Packard Development Company, L.P.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

function FSM(states, context)
{
	this._context = context || states;
	this._states = states;
	this._state = "__uninitialized";
	
	var self = this;
	this._context.go = function(nstate)
	{
		self.go(nstate);
	};
	this._context.event = function()
	{
		return self.event.apply(self, arguments);
	};
	this._states.__uninitialized = {};
	setTimeout(function()
	{
		self.go("__start");
	}, 0);
}

exports.Control.FSM = FSM;

FSM.prototype.currentState = function currentState() {
	return this._state;
};

/*
 * Go to the named state (if we're not there already).
 * When we change state we make the following function calls:
 * 1. [OLD STATE].exit
 * 2. [OLD STATE].to_[NEW STATE]
 * 3. [NEW STATE].from_[OLD STATE]
 * 4. [NEW STATE].enter
 * Any of these (including zero) will be called in this order.
 */
FSM.prototype.go = function go(nstate)
{
	while (this._state != nstate)
	{
		console.log("state " + this._state + " -> change to -> " + nstate);
		if (!nstate || !this._states[nstate])
		{
			// Error - Attempt to chance to a non-existant state
			console.log("Non-existstant state " + nstate);
			break;
		}
		// Call the exit event on the current state
		var fns = this._states[this._state];
		if (fns)
		{
			fns.__exit && fns.__exit.call(this._context);
			// Call the transition '__to_' event on the current state
			var tofn = fns["__to_" + nstate];
			tofn && tofn.call(this._context);
		}
		// Carefully get the new functions and from_ event before we change the current state
		fns = this._states[nstate];
		var fromfn = fns["__from_" + this._state];
		this._state = nstate;
		// Call the transition '__from_' event on the new state
		fromfn && fromfn.call(this._context);
		// Call the enter event on the current state if it exists.
		//  We allow enter to immediately move us to another state
		nstate = (fns.__enter && fns.__enter.call(this._context)) || this._state;
	}
};
	
/*
 * Send the named event to the current state.
 * This will call the method of the given name on the current event.
 */
FSM.prototype.event = function event(name /*, arguments ... */)
{
	console.log("state " + this._state + " -> event " + name);
	var fn = this._states[this._state][name];
	if (!fn)
	{
		fn = this._states[this._state].__any;
	}
	if (fn)
	{
		try
		{
			var nstate = fn.apply(this._context, Array.prototype.slice.call(arguments, 1));
			if (nstate)
			{
				this.go(nstate);
			}
		}
		catch (e)
		{
			console.log(e.stack);
			fn = this._states[this._state].__exception;
			if (fn)
			{
				try
				{
					var nstate = fn.call(this._context, e);
					if (nstate)
					{
						this.go(nstate);
					}
				}
				catch (e)
				{
					console.log(e.stack);
				}
			}
		}
		return true;
	}
	else
	{
		return false;
	}
};

