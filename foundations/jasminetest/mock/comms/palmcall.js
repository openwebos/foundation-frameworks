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

/*global exports, Future, PalmCall, console */
/**
 * A mockup class to palm call which simulates a Palm call and returns a predefined response.
 * @class PalmCall
 * @uses PalmCallCollection
 * @module foundations
 */
var sys = require('sys');

sys.puts("Loading PalmCall mock ..");
var PalmCall = exports.Comms.PalmCall =
{
	/**
	 * Seup a mockup implementation of the register and cancel methods
	 * 
	 * @method setup
	 * 
	 */
	setup: function() {
		PalmCall.register = function() { console.error('PalmCall -> Register called'); };
		PalmCall.cancel = function(){ //console.error('PalmCall -> Cancel called'); 
		}
	},
	/**
	 * Makes a call
	 *
	 * @method call 
	 * @param {String} _service Service name to be called
	 * @param {String} _method The method of the service to be called
	 * @param {String} _args Arguments that are passed to the called method of the service
	 * @return {Future}
	 */
	call: function(_service, _method, _args) {
		//console.log(">>>Palm Call " + _service + " with method " + _method + " \nand args=" + JSON.stringify(_args))
		return new Future(this._dispatch( _service, _method, JSON.stringify(_args)) );
	},
	
	/**
	 * 
	 * Dispatch the call and return the result. Will search through all the of the calls defined and will return 
	 * the result if one of the calls match the filter
	 *
	 * @method _dispatch
	 * @param {String} _service Service name to be called
	 * @param {String} _method The method of the service to be called
	 * @param {String} _args Arguments that are passed to the called method of the service
	 * @return {Object} returns the predefined response from PalmCallCollection
	 */
	_dispatch: function(_service, _method, _args) {
		var sservice;
		
		try {
			if( typeof(global) !== 'undefined' && typeof(global['PalmCallCollection']) !== 'undefined') {
				sservice = global.PalmCallCollection.locate( _service, _method, _args );
				//console.log(">>>Palm Call response" + JSON.stringify(sservice))
				if(sservice !== null) {
					sservice.payload = function(payload) { return sservice; };
				}
				return ( sservice !== null ? sservice : {})
			}
		} catch(excepter) {
			console.error('palmCall exception caught!');
			console.error(excepter);
		}
		
		return {};
	}
};
