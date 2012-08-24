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
 * An AjaxCall item from the collection that is used in order to send back the required response for an URL and a method used to make the AjaxCall
 * @class ajaxCallCollectionItem
 * @module foundations
 * @constructor
 * @param {Object} _args
 * @uses ajaxCallCollectionItemRule
 */
ajaxCallCollectionItem = function(_args) {
	/**
	 * the collection item's type: GET, POST, and so on
	 *
	 * @property {String} type
	 */
	this.type = _args.type || "GET";
	/**
	 * The collection item's url
	 *
	 * @property {string} url
	 */
	this.url = _args.url || "";
	/**
	 * The rules for the collection item that are used to filter out queries
	 *
	 * @property {Array} rules
	 */
	this.rules = [];
	this.addRules(_args.rules);
}
/**
 * Add rules to the current item. _rules is an array of objects made out of:
 * 		- filters: the filters to be applied on a query to retrieve its response
 * 		- result:  the result returned if the filters match the query. Will only be returned if all the filters pass
 * the test
 *
 * @method addRules
 * @param {Array} _rules
 */
ajaxCallCollectionItem.prototype.addRules = function(_rules) {
	var i, len = _rules.length;
	
	for( i = 0; i < len; i++) {
		this.addRule(_rules[i]);
	}
}
/**
 * Add a rule to the current item. A rule is made out of:
 * 		- filters: the filters to be applied on a query to retrieve its response - an array
 * 		- result:  the result returned if the filters match the query. Will only be returned if all the filters pass
 * the test - will be of type String or Object ( JSON )
 *
 * the test
 * @method addRule
 * @param {Object} _rule
 */
ajaxCallCollectionItem.prototype.addRule = function(_rule) {
	if(_rule) {
		if( _rule instanceof ajaxCallCollectionItemRule) {
			this.rules.push(_rule);
		} else {
			this.rules.push(new ajaxCallCollectionItemRule(_rule));
		}
	}
}

/**
 * Search for a resposne in the collection of rules. _args is a palmcall object. The request path param will
 * be used for filtering
 * 
 * @method locate
 * @param {Object} _args
 * @return {Object|String|null} response
 */
ajaxCallCollectionItem.prototype.locate = function(_args) {
	try {
		var requestPath = _args.requestPath || null, i, len;

		if(requestPath) {
			len = this.rules.length;
			for( i = 0; i < len; i++) {
				if(this.rules[i].isValid(_args)) {
					return this.rules[i].response;
				}
			}
		}

		return null;
	} catch(exc) {
		console.error(JSON.stringify(exc));
		return null;
	}
}
/**
 * Model for a rule for the current item. _args is an Object of:
 *  	- filters: the filters to be applied on a query to retrieve its response - an array
 * 		- result:  the result returned if the filters match the query. Will only be returned if all the filters pass
 * the test - will be of type String or Object ( JSON )
 * @class ajaxCallCollectionItemRule
 * @module foundations
 */
ajaxCallCollectionItemRule = function(_args) {
	/**
	 * An array of filters to be applied
	 *
	 * @property {Array} filters
	 */
	this.filters = _args.filters || [];
	/**
	 * The response returned if one of the filters have a true result
	 *
	 * @property {object} response
	 */
	this.response = _args.response || {};
}

/**
 * Checks if the current rule is valid. it will apply all the filters on it and if one of the filters fail then the rule is invalid
 * @method isValid
 * @param {string} _test
 * @return {boolean}
 */
ajaxCallCollectionItemRule.prototype.isValid = function(_test) {
	var isValid = true, i, len, filter;
	
	try {
		len = this.filters.length;
		
		if(len === 0)
			return true;
	
		for( i = 0; i < len; i++) {
			filter = this.filters[i];
			if( typeof(filter) === 'function' ) {
				if( !filter(_test, this) ) return false; 
			}
		}
		
		return true;
	} catch(except) {
		console.error('ajaxCall collection item rule is valid exception: ' + JSON.stringify(except));
		return false;
	}
}
/**
 * A collection of ajaxcall items that define the rules by which a certain responses are sent back to the caller
 * @constructor
 * @class ajaxCallCollection
 * @module foundations
 * @uses ajaxCallCollectionItem
 */
var ajaxCallCollection = function() {
	/**
	 * A collection of ajax call items
	 *
	 * @property {object} _items
	 */
	this._items = {};
}

/**
 * Finds an url matching its partial description to all the urls from the given method. This is used in case of goole contact photos for example,
 * where the url is made out of the photo path an photo identifier. It would be a pain to code the urls for all the contacts so we will specify
 * only the photo path, for example http://www.google.com/m8/feeds/photos/media/svtests2.2%40gmail.com/ and return the same result for all the
 * contact photos. This will be called only if the full url matching failes.
 * 
 * @method findMatchingUrl
 * @param {object} _method Method used to match the URL eg. GET, POST
 * @param {string} _url The URL that is searched against through the defined AjaxCallItems
 * @return {ajaxCallCollectionItem or null}

 */
ajaxCallCollection.prototype.findMatchingUrl = function(_method, _url) {
	var key;
	
	for(var key in _method) {
		if(_url.indexOf(key) !== -1) {
			return _method[key];
		}
	}
	
	return null;
}

/**
 * Find an item in the collection and return it if exists or null if it does not exist
 * 
 * @method findItem
 * @param {String} _method Method used to match the URL eg. GET, POST
 * @param {String} _url The URL that is searched against through the defined AjaxCallItems
 * @return {ajaxCallCollectionItem or null}
 */
ajaxCallCollection.prototype.findItem = function(_method, _url) {
	var method;
	//console.log("Find item url=" + _url + " method=" + _method)
	if( typeof (this._items[_method]) !== 'undefined') {
		method = this._items[_method];
		if( typeof (method[_url]) !== 'undefined' && (method[_url] instanceof ajaxCallCollectionItem)) {
			return method[_url];
		} else {
			return this.findMatchingUrl(method, _url);
		}
	}

	return null;
}
/**
 * Adds a single item to the collection or if the item exists then will add the new rules.
 * _args can be a instance of ajaxCallCollectionItem or a object made out of:
 * 			- method - the call method (GET, POST)
 * 			- url - the url that will be invoked
 * 			- ruels - an array of rules:
 * 					- filters: an arrar that will contain all the filters used to test the queries
 * 					- response: an object or string with the result of the query if the test succeeded
 *
 * &nbsp; Adds a single item to the collection or if the item exists then
 * will add the new rules.<br>
 * &nbsp; _args can be a instance of ajaxCallCollectionItem or a object made
 * out of:<br>
 * &nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; - method - the call method (GET, POST)<br>
 * &nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; - url - the url that will be invoked<br>
 * &nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; - ruels - an array of rules:<br>
 * &nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; - filters: an arrar that will contain all the
 * filters used to test the queries<br>
 * &nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; - response: an object or string with the
 * result of the query if the test succeeded<br>
 * <br>
 * <b>Examples:</b><br>
 * &nbsp;&nbsp;&nbsp; global.ajaxCallCollection.addItem({<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; method : "GET",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; url : "http://api.facebook.com/restserver.php",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; filters : [<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; function(_args, _instance) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if( _args.parsedQueryString['method'] ) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; var method =
 * _args.parsedQueryString['method'];<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if( global.ajaxResponses[ method ] )<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; _instance.response =&nbsp;
 * global.ajaxResponses[ method ];<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; else _instance.response = {};<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return true;<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return false;<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }],<br>
 * <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; response : &nbsp;&nbsp;&nbsp;
 * 'RequestToken=eBOcvYJu3AbC1t.XqIXJFHdbrF0kdEhhCDVwgXjAIZ9VxqwSsbapjve7l8zlIQpupaK3JSAhvcqQWNtOs.fKdbT9AuqOs_HTlWNaKxMxQjLjVUmsx0dY8YODLs.mWxb4.5Z5CbYVfyB7QYVryU_4DQtfJeT2u64hoSbr13Nv0Y3kZK5MmRcL6XDqT0Iun4uL9rjREwMBa_cKWasNl8ECSombv._LRm28'<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; });<br>
 * <br> <b> Will return the results specified in global.ajaxResponses for the invoked method if the ajaxcall has one defined in the call arguments.</b><br><br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; global.ajaxCallCollection.addItem({<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; method : "GET",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; url: "http://fbcdn-profile-a.akamaihd.net/",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; filters: [ function() { return true; } ],<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; response: "."<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }); <br>
 * <br> <b> Will return a "." character for each of the requests made to the url. (the filters would always return true) </b><br><br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; global.ajaxCallCollection.addItem({<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; method : "GET",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; url :
 * "http://www.google.com/m8/feeds/contacts/tester%40gmail.com/base/d4e8d90efdd272",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; filters : [],<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; response : global.ajaxResponses["basecontacts"]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
 * <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; });<br>
 * <br><b> Will return the base conatcts defined in the variable for the given url (no filter is defined)  </b><br><br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; global.ajaxCallCollection.addItem({<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; method : "GET",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; url :
 * "http://www.google.com/m8/feeds/contacts/default/full",<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; rules : [{<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; filters : [<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; function(_args, _instance) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; var si = _args.parsedQueryString["start-index"]
 * || null, mr = _args.parsedQueryString["max-results"] || null;<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(si != null &amp;&amp; mr != null) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; if(global.ajaxResponses["resp" + si]) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; _instance.response =
 * global.ajaxResponses["resp" + si];<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return true;<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return false;<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }],<br>
 * <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; response : global.ajaxResponses["resp51"]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }, {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; filters : [<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; function(_args) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return
 * ajaxCallCollection.mustExist(_args.parsedQueryString, 'max-results')<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; },<br>
 * <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; function(_args) {<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; return
 * ajaxCallCollection.mustNotExist(_args.parsedQueryString,
 * 'start-index')<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }],<br>
 * <br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; response : global.ajaxResponses["firstSet"]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }]<br>
 * &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; });<br>
 * <br> <b> Will return the results depending on the max-results and start-index parameters (if they exist) </b><br><br>
 * <br>
 *
 * @method addItem
 * @param {Object} _args
 */
ajaxCallCollection.prototype.addItem = function(_args) {
	var method = _args.method || "GET", item, url;

	if( typeof (_args) === 'undefined' || typeof (_args.url) === 'undefined') {
		console.error('Method name need to be provideed for ajaxCallCollection! Could not add item!');
		return;
	}

	if( typeof (this._items[method]) === 'undefined') {
		this._items[method] = {};
	}
	item = this.findItem(method, _args.url);
	
	if(item == null) {
		this._items[method][_args.url] = ( _args instanceof ajaxCallCollectionItem ? _args : (new ajaxCallCollectionItem(_args)));
	} else {
		item.addRules(_args.rules || []);
	}
}
/**
 * Will search a request for a result match. Args is an object of:
 * 			- method: ajax call method
 * 			- url: the quest url
 * 			- requestPath - the path requested, it is the url parameter together with the request parameters
 * 			- headers - request ehaders
 * 			- body - request body, only in acse of post requests
 * 			- bodyEncoding - request body encoding
 *
 * @method locate
 * @param {Object} _args
 * @return {ajaxCallCollectionItem}
 */
ajaxCallCollection.prototype.locate = function(_args) {
	var item = this.findItem(_args.method || "GET", _args.url);
	//console.log( item === null ? "Item was not found in the collection" : "Item found in collection!");
	return (item === null ? null : item.locate(_args));
}

/**
 * Checks if a property exists in an object
 * 
 * @method mustExist
 * @param {object} _object
 * @param {string} _prop
 * @return {boolean}
 */
ajaxCallCollection.prototype.mustExist = function( _object, _prop ) {
	var op = _object[_prop] || null;
	return ( op !== null );		
}

/**
 * Checks if a property does not exist in an object
 * 
 * @method mustNotExist
 * @param {object} _object
 * @param {string} _prop
 * @return {boolean}
 */
ajaxCallCollection.prototype.mustNotExist = function( _object, _prop) {
	//console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> must not exist');
	var op = _object[_prop] || null;
	return ( op === null );
}

/**
 * Deletes all the items from AjaxCallCollection
 * 
 * @method clear
 */
ajaxCallCollection.prototype.clear = function() {
	this._items = {};
}

ajaxCallCollection = new ajaxCallCollection();
global.ajaxCallCollection = ajaxCallCollection;
exports.ajaxCallCollection = ajaxCallCollection;
global.ajaxCallCollectionItem = ajaxCallCollectionItem;
exports.ajaxCallCollectionItem = ajaxCallCollectionItem;
global.ajaxCallCollectionItemRule = ajaxCallCollectionItemRule;
exports.ajaxCallCollectionItemRule = ajaxCallCollectionItemRule;
