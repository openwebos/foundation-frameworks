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

/**
 * State machine mockup. This is a mockup that allows us to spy on the states and events of the state machine.
 * @class FSM
 * @module foundations
 * @constructor
 */
function FSM(states, context) {
	/**
	 * @property {Object} _context
	 */
	this._context = context || states;
	/**
	 * @property {Object} _states
	 */	
	this._states = states;
	/**
	 * @property {String} _state
	 */
	this._state = "__uninitialized";

	var self = this;
	this._context.go = function(nstate) {
		self.eventGo(nstate);
	};
	this._context.event = function() {
		return self.event.apply(self, arguments);
	};
	this._states.__uninitialized = {};

	//console.log('Starting the first go!');
	setTimeout( function() {
		self.eventGo("__start");
	});
	//console.log('END starting the first go!');
	global.eventFSM = this;
};

exports.Control.FSM = FSM;

/**
 * The current state machine state
 * @method currentState
 * return {String} state
 */
FSM.prototype.currentState = function currentState() {
	return this._state;
};

/**
 * Go to the named state (if we're not there already).
 * When we change state we make the following function calls:
 * <br>1. [OLD STATE].exit
 * <br>2. [OLD STATE].to_[NEW STATE]
 * <br>3. [NEW STATE].from_[OLD STATE]
 * <br>4. [NEW STATE].enter
 * Any of these (including zero) will be called in this order.
 * 
 * @method go
 * @param {String} nstate
 */
FSM.prototype.go = function go(nstate) {
	this.goToEvent(nstate);
};

/**
 * Go to the named state (if we're not there already).
 * 
 * @method goToEvent
 * @param {String} nstate
 */
FSM.prototype.goToEvent = function goToEvent(nstate) {
	var that = this;

	//jasmine.currentEnv_ = global.jasminEnv;
	if (that._state != nstate) {
		console.log("state " + that._state + " -> change to -> " + nstate);
		if (!nstate || !that._states[nstate]) {
			// Error - Attempt to chance to a non-existant state
			console.log("Non-existstant state " + nstate);
			return null;
		}
		// Call the exit event on the current state
		var fns = that._states[that._state];
		if (fns) {
			fns.__exit && fns.__exit.call(that._context);
			// Call the transition '__to_' event on the current state
			var tofn = fns["__to_" + nstate];
			tofn && tofn.call(that._context);
		}
		// Carefully get the new functions and from_ event before we change the current state
		fns = that._states[nstate];
		var fromfn = fns["__from_" + that._state];
		that._state = nstate;
		// Call the transition '__from_' event on the new state
		fromfn && fromfn.call(that._context);
		// Call the enter event on the current state if it exists.
		//  We allow enter to immediately move us to another state
		nstate = (fns.__enter && fns.__enter.call(that._context)) || that._state;
		if (nstate != that._state) {
			nstate = this.go(nstate);
		}
	}
};

/**
 * Go to the new event that is speciffied by the parameter _nevent
 * @method eventGo
 * @param {String} _nevent
 */
FSM.prototype.eventGo = function(_nevent) {
	var self = this;

	self.go(_nevent);
	return;
};

/**
 * Send the named event to the current state.
 * This will call the method of the given name on the current event.
 * This method will be mocked up in fsmSpy
 * 
 * @method event
 * @param {String} name
 * @param {Array} other arguments
 * @return {Object}
 */
FSM.prototype.event = function event(name /*, arguments ... */) {
	return this.processEvent.apply(this, arguments);
};

/**
 * Send the named event to the current state.
 * This will call the method of the given name on the current event.
 * 
 * @method processEvent
 * @param {String} name
 */
FSM.prototype.processEvent = function processEvent(name) {
	var fn = this._states[this._state][name];
	if (!fn) {
		fn = this._states[this._state].__any;
	}

	if (fn) {
		try {
			var nstate = fn.apply(this._context, Array.prototype.slice.call(arguments, 1));
			if (nstate) {
				this.eventGo(nstate);
			}
		} catch (e) {
			console.log(e.stack);
			fn = this._states[this._state].__exception;
			if (fn) {
				try {
					var nstate = fn.call(this._context, e);
					if (nstate) {
						this.eventGo(nstate);
					}
				} catch (e) {
					console.log(e.stack);
				}
			}
		}
		return true;
	} else {
		return false;
	}
};
