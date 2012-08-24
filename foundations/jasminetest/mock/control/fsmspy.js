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
 * Spy class for future state machine
 * @class FsmSpy
 * @uses FSM, serviceManager
 * @module foundations 
 * @constructor
 */
var FsmSpy = function() {
	/**
	 * @property {object|null} pubMessage
	 */
	this.pubMessage = null;
	/**
	 * @property {object|null} application
	 */
	this.application = null;
	/**
	 * @property {Integer} serviceIndex
	 */
	this.serviceIndex = 0;
	/**
	 * @property {String} command
	 */
	this.command = 'sync';
	/**
	 * @property {Array} states
	 */
	this.states = [];
	/**
	 * @property {object|null} stateCallback
	 */
	this.stateCallback = null;
	/**
	 * @property {object} oncomplete
	 */
	this.onComplete = this.defaultOnComplete;
	/**
	 * @property {Boolean} complete
	 */
	this.complete = false;
	/**
	 * @property {object|null} serviceData
	 */
	this.serviceData = null;
	/**
	 * @property {object|null} service
	 */
	this.service = null;
	/**
	 * @property {object|null} lastCallArguments
	 */
	this.lastCallArguments = null;
}

FsmSpy.prototype = {
	/**
	 * Set a palm bus message
	 * 
	 * @method setPbusMessage
	 * @param {object} _pbusMessage
	 */
	setPbusMessage: function( _pbusMessage ) {
		this.pubMessage = _pbusMessage;
	},
	
	/**
	 * Set application controller
	 * 
	 * @method setApplication
	 * @param {object} _application
	 */
	setApplication : function( _application ) {
		this.application = _application;
	},
	
	/**
	 * Set the index of the service to be used to run commands
	 * 
	 * @method setServiceIndex
	 * @param {int} _serviceIndex
	 */
	setServiceIndex: function( _serviceIndex ) {
		this.serviceIndex = _serviceIndex;
	},
	
	/**
	 * Set the command name to run
	 * 
	 * @method setcommand
	 * @param {string} _command
	 */
	setCommand: function( _command ) {
		this.command = _command; 
	},
	
	/**
	 * Set an array of sync states the fsm should pass over
	 * 
	 * @method setStates
	 * @param {array} _states
	 */
	setStates: function( _states ) {
		this.states = _states;
	},
	/**
	 * Set an object that holds the service data
	 * 
	 * @method setServiceData
	 * @param {array} _states
	 */
	setServiceData: function( _sdata ) {
		this.serviceData = _sdata;
	},

	/**
	 * Set the callback fucntion to be called when the state changes. Will be called with the following params:
	 * 		- current context
	 * 		- state name
	 * 		- jasmine spy object - this will give the possibility to retrive the number of calls made to the spied on method and other usefull 
	 * stuff
	 * 
	 * @method setStateCallback
	 * @param {function} _callback
	 */
	setStateCallback: function( _callback ) {
		this.stateCallback = _callback;
	},
	
	/**
	 * This will set a function to be called when ajsmine finishes the waitsFor block ( either when the fsm states number equal the number 
	 * 	of states defined by the user or when the timeout has expired )
	 * 
	 * @method setRuns
	 * @param {function} _runs
	 */
	setOnComplete : function(_onComplete) {
		this.onComplete = _onComplete;
	},
	
	/**
	 * This will be called when no custom runs function is defined and will only check if all the states defined by the user match the states the
	 * sync went over.
	 *
	 * @method defaultOnComplete
	 */
	defaultOnComplete : function() {
		try {

			var startCall = 0;
			var endCall = IMPORTS.foundations.Control.FSM.prototype.go.callCount;
	
			for (var i=startCall;i<endCall;i++) {
				console.log(IMPORTS.foundations.Control.FSM.prototype.go.argsForCall[i][0] + ' => ' + this.states[i]);
				//expect(IMPORTS.foundations.Control.FSM.prototype.go.argsForCall[i][0]).toEqual(this.states[i]);
			}
			
		} catch(exc) {
			console.log(JSON.stringify(exc));
		}
	},
	
	/**
	 * 
	 * Shut down the application
	 *
	 * @method shutdownApp
	 */
	shutdownApp: function() {
		console.log('Attempting to close the application!');
		if( this.serviceManager !== null ) {
			this.serviceManager.shutDown();
		}
	},
	
	/**
	 * Clear a spy's data and mark the spy process as completed
	 * 
	 * @method clearSpy
	 * @param {object} _spy
	 */
	clearSpy: function( _spy ) {
		try {
			this.complete = true;
			_spy.reset();
			
		} catch(except) {
			console.log( JSON.stringify(except) );
		}
	},
	
	/**
	 * Loads the sources for a service and start it if the _startService param is not set to false. Default is true. 
	 * 
	 * @method loadService
	 * @param {boolean} _startService
	 */
	loadService: function( _startService ) {
		var startService = ( typeof(_startService) !== 'undefined' ? _startService : true);
		
		this.serviceData.serviceIndex = this.serviceIndex;
		this.serviceManager = new global.serviceManager( this.serviceData );
		this.service = this.serviceManager.loadService( startService );
		return this.service; 
	},
	
	/**
	 * Run the command and spy over the states
	 * 
	 * @method run
	 */
	run: function() {
		var that = this;
		
		if (!this.service) {
			this.loadService();
		}
			
		if( !this.service ) {
			console.log('Could not load service!');
			return;
		}

		function stateTest() {
			var nstate = arguments[0], shouldCallEvent = true;
			if( nstate !== this._state) {
				// In case we have reached the error state then get the exception and write it to the xml output
				// this._context - the service assistant
				// this._context._error - the exception
				if( nstate === 'error' ) {
				  try {
				      // if the custom error reporter is defined then call it
				      // else report the error using equality
				      expect(this._state).reportStateException(JSON.stringify(this._context._error));
				  } catch(exce) {
				      expect(this._state).toEqual(JSON.stringify(this._context._error));
				  }
				}
				that.lastCallArguments = this.lastCallArguments;
				if( that.stateCallback !== null ) {
				    shouldCallEvent = that.stateCallback( this, arguments[0], IMPORTS.foundations.Control.FSM.prototype.go, this.lastCallArguments );
				}
				
				if(shouldCallEvent) {
				    this.goToEvent(arguments[0]);
				}
				
			}
		}
			
		spyOn(IMPORTS.foundations.Control.FSM.prototype, 'go').andCallFake(stateTest);
		
		this.service.commands['sync'].watch = null;
		this.service.commands['sync'].subscribe = null;
		this.service._dispatchCommand(true, this.service.commands[this.command], this.pubMessage);

		waitsFor(function() {
			return IMPORTS.foundations.Control.FSM.prototype.go.callCount >= that.states.length;
		}, "Not reached state", 10000);
		runs(function() {
			that.onComplete(arguments);
			that.clearSpy(IMPORTS.foundations.Control.FSM.prototype.go);
			that.shutdownApp();
		});
	},
	
	/**
	 * Run the spy on a state. As the state searched for sometimes requires the results from the previous states,
	 * this method will run through all the states defined until the desired state is found. If the state is found
	 * then will trigger the methdos defined in the _callbacks param. <br>
	 * _callback:  <br>
	 *		 onBeforeState(<current instance>, <original function arguments>, <the next future instance>): will be triggered before entering the searched state. <br>
	 *		 onAfterState(<current instance>, <original function arguments>, <the next future instance>): will be triggered after the searched state.  <br>
	 * 		 eventCallback()<current instance>, <original function arguments>, <the next future instance>): will be called when we reached the searched state's event <br>
	 * <br>
	 *	FOR EX: <br>  
	 *			'eventCallback' : function(  _instance, _args, _jasminObj ) { <br>
	 *				var args = _args || null, future = args[1] || null  <br>
	 *				if( typeof(future) !== 'undefined' &&  future !== null) { <br>
	 *					expect(future.result['entries'].length).eventTestResultsToEqual(entryLength.shift()); <br>
	 *				} <br>
	 *<br>
	 *				return true;<br>
	 *			} <br>
	 *
	 * FOR:  fSpy.runState("getMoreRemoteChanges", "gotReply", callbacks); <br>
	 *<br>
	 * 		- will search for "getMoreRemotechanges" state <br>
	 *		- if found then will search for "gotReply" event <br>
	 *		- if the event is triggered then it will call the eventCallback function defined above, which will take all <br> 
	 * the event's arguments and will compare the length of the results with some predefined values <br>
	 *		- The return true statement specidies that the current flow can continue <br>
	 *		- this will repeat for each of the cases the state  / event repeats <br>
	 *		- If the forth argument were true then all the flow would have stopped at the first getMoreRemotechanges / gotReply occurence <br>
	 *<br>
	 * @param {String} _state - the state we are searching for
	 * @param {String} _event - the event we are searching for, the default event is gotReply
	 * @param {object} _callbacks - a hash of callbacks defined above
	 * @param {Boolean} _stopAtFirstEvent - do we need to stop after the first occurence or run over all? ( state can be called several times and the event on it will be called the same number fo times )
	 * @method  runState
	 */
	runState: function( _state, _event, _callbacks, _stopAtFirstEvent ) {
		var that = this, 
			stateRun = false, // did we reach the desired state? 
			stateCalled = false,  // did we finish calling the state?
			currFuture = null,  // current future
			futureSpyNowSpy = null,  // the spy set on future now
			futureSpyThenSpy = null, // the spy set on future then
			callbacks  = _callbacks || {}, // a hash of callback items
			onBeforeState = callbacks.onBeforeState || null, // a function to be called before going to the desired state
			onAfterState = callbacks.onAfterState || null, // a function to be called when leaving the desired state
			eventCallback = callbacks.eventCallback || null, // the function to be called before calling the requested event
			spiedEvent = _event || "gotReply", // the event we are spying on ... if no event is specified then we will spy on the gotReply event of the current state
			readyForEvent = false, // are we ready to spy on the event? If yes then it means the given state is reached
			stopAtFirstEvent = _stopAtFirstEvent || false; // should we stop after the first event is found?
		
		if (!this.service) {
			this.loadService();
		}

		if(!this.service) {
			console.log('Could not load service!');
			return;
		}

		function stateTest() {
			// if we are not at the given state
			if( arguments[0] !== _state ) {
				// did we just pass over the given state?
				if( stateRun === true ) {
					// if there is a state finish callback then call it
					if( onAfterState !== null ) {
						onAfterState( this, arguments, futureSpyThenSpy );
					}
					
					console.log('On after state called here!');
					// mark the state as processed
					stateCalled = true;
					// in case we could not find the state's event ... clear the listening spy
					readyForEvent = false;
					stateRun = false;
					if( stopAtFirstEvent === false ) {
						this.goToEvent( arguments[0] );
					}
				} else {
					this.goToEvent( arguments[0] );
				}
			} else {
				// we are the given state and if there is a before state callback defined then call it
				if( onBeforeState !== null ) {
						onBeforeState( this, arguments, futureSpyThenSpy );
				}
				//tell the fsm event spy that it can process the given event
				readyForEvent = true;
				// load the given state
				// we cannot call the state directly as there are some data dependencies from the previous state(s)
				this.goToEvent( _state );
				stateRun = true;
			}
		}
			
		function FsmEventHandler() {
			try {
				var canContinue = true;
				
				if( readyForEvent === true && arguments[0] === spiedEvent ) {
					if( eventCallback !== null ) {
						canContinue = eventCallback(this, arguments, fsmEventSpy);
					}
					
					if( stopAtFirstEvent === false ) {
						readyForEvent = false;
						stateRun = false;
					}
				}
				
				if( canContinue === true ) {
					this.processEvent.apply(this, arguments);
				}
			} catch(except) {
				console.log(except);
			}
		}
		
		spyOn(IMPORTS.foundations.Control.FSM.prototype, 'go').andCallFake(stateTest);
		futureSpyThenSpy = spyOn(IMPORTS.foundations.Control.Future.prototype, 'then').andCallThrough();//.andCallFake(futureSpyThen);
		futureSpyNowSpy = spyOn(IMPORTS.foundations.Control.Future.prototype, 'now').andCallThrough();//.andCallFake(futureSpyNow);
		fsmEventSpy = spyOn(IMPORTS.foundations.Control.FSM.prototype, 'event').andCallFake(FsmEventHandler);

		this.service.commands[this.command].watch = null;
		this.service.commands[this.command].subscribe = null;
		this.service._dispatchCommand(true, this.service.commands[this.command], this.pubMessage);

			waitsFor(function() {
				console.log("Wait for state: " + stopAtFirstEvent + ' ' + stateCalled);
				return (stopAtFirstEvent === true ? stateCalled : (IMPORTS.foundations.Control.FSM.prototype.go.callCount >= that.states.length) );
			}, "Not reached state", 10000);
			runs(function() {
				that.onComplete(arguments);
				that.clearSpy(IMPORTS.foundations.Control.FSM.prototype.go);
				that.shutdownApp();
			});
	}
}

global.FsmSpy = FsmSpy;