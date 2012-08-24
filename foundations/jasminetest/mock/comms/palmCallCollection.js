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
 * Palm call item class
 * @class PalmCallItem
 * @uses PalmCallRule
 * @module foundations
 * @constructor
 */

var sys = require('sys');

sys.puts("Loading PalmCallCollection mock ..");

var PalmCallItem = function( _method, _rules) {
	/**
	 * An array of palm call rules
	 *
	 * @property {Array} rules
	 */
	this.rules = [];
	this.addRules( _rules || [] );
	/**
	 * Palm call method
	 *
	 * @property {String} _method
	 */
	this.method = _method || "";
};
/**
 * Add a new item. Each of the items can have multiple rules
 *
 * @method add
 * @param {String} _method
 * @param {Array} _rules
 */
PalmCallItem.prototype.add = function(_method, _rules) {
	this.method = _method;
	this.addRules( _rules );
};
/**
 * Add rules - translate from array to PalmCallRules
 *
 * @method addRules
 * @param {Array} _rules
 */
PalmCallItem.prototype.addRules = function( _rules ) {
	var i, len, rule;

	len = _rules.length;
	for(i=0; i< len; i++) {
		rule = _rules[i];
		this.addRule(rule);
	}

	//console.log('Length after adding rules: ' + this.rules.length);
};
/**
 * Add a rules, get the rules and create a PalmCallRules object from it
 *
 * @method addRule
 * @param {Object} _rule
 */
PalmCallItem.prototype.addRule = function( _rule ) {
	if( _rule instanceof PalmCallRule) {
		this.rules.push(_rule );
	} else {
		this.rules.push( new PalmCallRule(_rule.test, _rule.result, _rule.method || null) );
	}
};
/**
 * Get the list of rules (an array of PalmCallRule objects)
 * @method getRules
 * @return {Array}
 */
PalmCallItem.prototype.getRules = function() {
	return this.rules;
}
/**
 * Search the entire collection for a valid response
 * @method locate
 * @param {String} _data
 * @return {Object|String|null} result of the search
 */
PalmCallItem.prototype.locate = function( _data ) {
	var len, i, result;

	len = this.rules.length;
	for(i=0; i<len; i++) {
		result = this.rules[i].check( _data );
		if( result !== null ) {
			return result;
		}
	}

	return null;
}
/**
 * Rule model for PalmCallItem
 * @class PalmCallRule
 * @constructor
 * @module foundations
 */
var PalmCallRule = function( _test, _result, _method) {
	/**
	 * The test defined for the rule to be valid
	 *
	 * @property {Array,function,String} _test
	 */
	this.test = _test || "";
	/**
	 * The rule's method
	 *
	 * @property {String|null} _method
	 */
	this.method = _method || null;
	/**
	 * Teh result of the palm call
	 *
	 * @property {Array|Object|String} _result
	 */
	this._result = _result;
	this.parsedResult = this._2Array(_result || "");
}
/**
 * Parse a test string to json 
 * @method test2JSON
 * @param {String} _test
 * @return {Object|null} json
 */
PalmCallRule.prototype.test2JSON = function( _test ) {
	var resJSON = null;
	try {
		resJSON = JSON.stringify( _test );
	} catch(exc) {
		resJSON = _test;
	}
	
	return resJSON;
}
/**
 * Convert a string JSON to object and store it in parsedResult or if _result is not a string then store it directly
 * @method _2Array
 * @private
 * @param {String|Object} _result
 *
 */
PalmCallRule.prototype._2Array = function( _result ) {
	if( typeof(_result) === 'string' ) {
		try {
			this.parsedResult = JSON.parse( _result );
		} catch(except) {
			this.parsedResult = _result;
		}
	} else {
		this.parsedResult = _result;
	}
	
	return this.parsedResult;
};
/**
 * Convert the internal representation to json
 * @method _2JSON
 * @private
 * @return {String}
 */
PalmCallRule.prototype._2JSON = function( ) {
	return JSON.stringify(this.parsedResult);
};
/**
 * Return the object as json
 * @method get
 * @return {Object}
 */
PalmCallRule.prototype.get = function() {
	return {
		"test" : this.test,
		"result" : this.getResult()
	};
};
PalmCallRule.prototype.__defineGetter__("result", function getResult() {
	var res = null;
	try {
		res = this.parsedResult;//this._2JSON();
	} catch(except) {
		res = this._result;
	}
	
	return res;
});
/**
 * Check to see if the filter matches data and if so return the result
 * @method check
 * @param {String} _data
 * @return {Object|null} result
 */
PalmCallRule.prototype.check = function(_data) {
	if( typeof(this.test) === 'function' ) {
		var resp = this.test( this, _data );
		if( resp === true ) return this.result;
	} else {
		if( _data.indexOf(this.test) !== -1) {
			return this.result;
		}
	}
	
	return null;
};
/**
 * Remove a rules instance
 * @method remove
 */
PalmCallRule.prototype.remove = function() {
	this.test = null;
	this.result = null;
	this.parsedResult = null;
};
/**
 * Will implement a collection of PalmCallItems and the handler methods.
 * @class PalmCallCollection
 * @uses PalmCallItem
 * @module foundations
 * @constructor
 */
var PalmCallCollection = {
	/**
	 * A collection of typed PamCallItems.
	 * @private
	 * @property {object} _items
	 */
	_items: {},

	/**
	 * Clear the collection for a given service
	 * @method rest
	 * @param {String} _service
	 */
	reset: function( _service ) {
		if( typeof(_service) !== 'udnefined') {
			this._items["service"] = null;
		} else
			this._items = {};
	},
	/**
	 * Fully erase the collection
	 * @method clear
	 */
	clear: function() {
		this.reset();
	},
	/**
	 *
	 * &nbsp; Add an item to the collection. Args param need to be built as
	 * follows:<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; args.method = method name<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; args.rules = a collection of rules for the method
	 * composed of:<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules.test - the test to be made<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules.result - the result returned if the test
	 * is valid<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp; Rules.result can be a json string, or an object of the result
	 * params which can be cornverted to JSON<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp; Rules can also be a PalCollectionItem<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp; If overwrite is true then if the current method is found in
	 * the item collection it will deleted and added again as all the rules
	 * from the<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp; method will be added to the current rules<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp; <br>
	 * <b>Example:</b><br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;<small><i>
	 * global.PalmCallCollection.addItem("palm://com.palm.service.accounts/",
	 * {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; "method" : "readCredentials",<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; "test" : '"accountId":"++HhW1mHnnVIVpV3"',<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'result' : {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; returnValue : true,<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; credentials : {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
	 * "sessionKey":"7711ccfd263b7a7465965e25.0-100001989146467",<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
	 * "accessToken":"4620273157|7711ccfd263b7a7465965e25.0-100001989146467|oMDb6tfioEBUwkwfK39Z2lBMr2U",<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; "uid":100001989146467<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
	 * &nbsp;&nbsp;&nbsp; });</i></small><br>
	 * &nbsp;&nbsp; <br>
	 * &nbsp;&nbsp;&nbsp; This would add a palm call for
	 * palm://com.palm.service.accounts/, for method readCredentials. The
	 * rule specifies that if a palm call is made to the url with the given
	 * method and the call parameters contain a string
	 * "accountId":"++HhW1mHnnVIVpV3" then the specified result will be
	 * returned. <br>
	 * <br>
	 * &nbsp;&nbsp;&nbsp;<small> global.PalmCallCollection.addItem("luna://com.palm.keymanager/",
	 * {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'method' : 'fetchKey',<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'test' : function(_obj, _args) {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(_args.keymae)<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(_args.keyname == 'app_key')<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return true;<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; },<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'result' : '&lt;?xml version="1.0" standalone="yes"
	 * ?&gt;&lt;Key&gt;&lt;WrappingKeyInfo&gt;&lt;owner&gt;com.palm&lt;/owner&gt;&lt;id&gt;master.1&lt;/id&gt;&lt;/WrappingKeyInfo&gt;&lt;iv&gt;4UpRamhzRzLmYxojhrd75w==&lt;/iv&gt;&lt;algorithmName&gt;AES-128-CBC&lt;/algorithmName&gt;&lt;hash&gt;PvaKN7/XlxCEioyh0gPiRtS7S+7zHSzCBJBbpSJkKYQ=&lt;/hash&gt;&lt;key&gt;hUWUpgrnREP1rk5OmAhir0J7nSe/me7KgFDevlMXTbozYzC/3IRqb6JJYxyXxTL8&lt;/key&gt;&lt;owner&gt;com.palm.service.contacts.facebook&lt;/owner&gt;&lt;id&gt;app_key&lt;/id&gt;&lt;size&gt;256&lt;/size&gt;&lt;type&gt;11&lt;/type&gt;&lt;scope&gt;1&lt;/scope&gt;&lt;/Key&gt;'<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }, {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'test' : function(_obj, _args) {<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(_args.keymae)<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(_args.keyname == 'app_secret')<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return true;<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; },<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; 'result' : '&lt;?xml version="1.0" standalone="yes"
	 * ?&gt;&lt;Key&gt;&lt;WrappingKeyInfo&gt;&lt;owner&gt;com.palm&lt;/owner&gt;&lt;id&gt;master.1&lt;/id&gt;&lt;/WrappingKeyInfo&gt;&lt;iv&gt;0n1UVpNIcYxLXRtRq0Y8dA==&lt;/iv&gt;&lt;algorithmName&gt;AES-128-CBC&lt;/algorithmName&gt;&lt;hash&gt;GVQrIfq50Zic+67FFtI+Pdsa9QpF7NgAqVsgSlmaNs8=&lt;/hash&gt;&lt;key&gt;ko3o8JdkbPrwFlgXfIZ25wINjEBU2+UnHN/hjEl418HflBa2m/OjDpACpufXgc2X&lt;/key&gt;&lt;owner&gt;com.palm.service.contacts.facebook&lt;/owner&gt;&lt;id&gt;app_secret&lt;/id&gt;&lt;size&gt;256&lt;/size&gt;&lt;type&gt;11&lt;/type&gt;&lt;scope&gt;1&lt;/scope&gt;&lt;/Key&gt;'<br>
	 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
	 * &nbsp;&nbsp;&nbsp; });</small><br>
	 * <br>
	 * &nbsp;&nbsp;&nbsp; In the second example, the call filter is a function, this means
	 * that if a call is amde to the keymanager with the method fetchKey
	 * then the function(s) defined in the test field will be run. If one
	 * of the functions from the filters section fail to execute then the
	 * whole rule fails, in other words all the filters defined need to be
	 * true. In our example if the arguments received by keymanager contain
	 * the app_secret key then the tests run as follows:<br>
	 * &nbsp;&nbsp;&nbsp; PalmCall would start to pass over all the defined rules. It
	 * calls the first test function which checks to see if we have the
	 * app_key defined in the call arguments. That key is not defined so
	 * the test will fail. PalmCall will pass to the second test, it checks
	 * to see if app_secret is defined, it finds the key so it will return
	 * the result.<br>
	 *
	 * @method addItem
	 * @param {String} _service
	 * @param {Object} args
	 * @param {Boolean} _overwrite
	 */
	addItem: function(_service, _args, _overwrite) {
		var method, overwrite = _overwrite || false;

		if( typeof(_args) === 'undefined' || typeof(_args.method) === 'undefined') {
			console.error('Method name need to be provideed for palmCallCollection! Could not add item!');
			return;
		}
		if( typeof(this._items[_service]) === 'undefined') {
			this._items[_service] = {};
		}

		method = this.findMethod( _service, _args.method );
		if( method === null || overwrite === true) {
			this._items[_service][_args.method] = ( _args instanceof PalmCallItem ? _args : (new PalmCallItem(_args.method, _args.rules)));
		} else {
			//console.error(JSON.stringify(this._items[_service][_args.method]) );
			if( _args instanceof PalmCallItem ) {
				items = ( this._items[_service][_args.method] ? _args.getRules() : _args.addRules(_args.rules));
			} else {
				method.addRules( _args.rules );
			}
		}
	},
	/**
	 * Finds a method inside the collection. The method should be a PalmCallItem object, if not then we need to filter it out
	 * @method findMethod
	 * @param {String} _service
	 * @param {String} _method
	 * @return {Object|null}
	 */
	findMethod: function( _service, _method ) {
		var service;

		if( typeof(this._items[_service]) !== 'undefined') {
			service = this._items[_service];
			if( typeof(service[_method]) !== 'undefined' && ( service[_method] instanceof PalmCallItem)) {
				return service[_method];
			}
		}

		return null;
	},
	/**
	 * Search the entire collection for a valid response
	 * @method locate
	 * @param {String} _data
	 * @return {Object|String|null} result of the search
	 */
	locate: function( _service, _method, _data) {
		try {
			_service = ( _service.charAt(_service.length - 1) !== "/" ) ? _service + "/" : _service;
			var method = this.findMethod( _service, _method);
			if(method != null) {
				return method.locate( _data );
			}
	
			return null;
		} catch(except) {
			console.error(JSON.stringify(except));
		}
	}
}

global.PalmCallCollection = PalmCallCollection;
global.PalmCallRule = PalmCallRule;
global.PalmCallItem = PalmCallItem;
exports.PalmCallCollection = PalmCallCollection;
exports.PalmCallRule = PalmCallRule;
exports.PalmCallItem = PalmCallItem;