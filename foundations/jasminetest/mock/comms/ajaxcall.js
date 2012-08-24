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
 * Class to handle asyncronus calls to a given url with the specified parameters
 * This is a modiffied implementation of the ajaxCall.js module from foundations 
 * which makes use of ajaxCallCollection in order to fetch predefined requests
 * 
 * @class AjaxCall
 * @module foundations
 * @uses ajaxCallCollection
 */
var sys = require('sys');
var urlModule = require('url');
var qs = require('querystring');
var bufferModule = require('buffer');

sys.puts("Loading PalmCall mock ..");

var AjaxCall = exports.Comms.AjaxCall = {
	/**
	 * A mockup for the function Setup the ajaxCall
	 * This is not used as we work only with nodejs approach
	 * @method setup
	 */
	setup: function() {
	},
	/**
	 * Shorthand call for GET method of AjaxCall
	 * @method get
	 * @param {String} url The url to which the call is made
	 * @param {Object} options The object that contains HTTP options to be sent
	 * @return {Future}
	 */
	get: function(url, options)
	{
		return this.call(AjaxCall.RequestMethod.GET, url, undefined, options);
	},
	/**
	 * Shorthand call for HEAD method of AjaxCall
	 * @method head
	 * @param {String} url The url to which the call is made
	 * @param {Object} options The object that contains HTTP options to be sent
	 * @return {Future}
	 */
	head: function(url, options)
	{
		return this.call(AjaxCall.RequestMethod.HEAD, url, undefined, options);
	},
	
	/**
	 * Shorthand call for POST method of AjaxCall
	 * @method post
	 * @param {String} url The url to which the call is made
	 * @param {String} body The body of the message sent to the webservice
	 * @param {Object} options The object that contains HTTP options to be sent
	 * @return {Future}
	 */
	post: function(url, body, options)
	{
		return this.call(AjaxCall.RequestMethod.POST, url, body, options);
	},
	
	/**
	 * Call an url with parameters
	 * @method call
	 * @param {String} method
	 * @param {String} url The url to which the call is made
	 * @param {String} body The body of the message sent to the webservice
	 * @param {Object} options The object that contains HTTP options to be sent
	 * @return {Future} the result of the call if any
	 */
	call: function(method, url, body, options) {
		return new Future().now(this, function(future) {
			try {
				/*console.log('Calling ajaxCall');
				console.log('Method: ' + method);
				console.log('Url: ' + url);
				console.log('Body: ' + body);
				console.log('Options: ' + JSON.stringify(options));*/

				options = options || {};
				// console.log("Options: " + JSON.stringify(options));
				method = method.toUpperCase();

				if (body && method !== AjaxCall.RequestMethod.POST) {
					if (url.match("\\?")) {
						url = url + "&" + body;
					} else {
						url = url + "?" + body;
					}
					body = undefined;
				}

				if (options.customRequest) {
					method = options.customRequest;
					method = method.toUpperCase();
				}
				//console.log("method = " + method);

				/*
				 * First we set up the http client.
				 */
				var parsed = urlModule.parse(url);
				var secure = (parsed.protocol === 'https:');
				var port = (secure) ? 443 : 80;

				/*
				 * Then we set up the http request.
				 */
				var headers = {};
				// Add all the generic headers that are always needed
				headers.host = parsed.host;
				// TODO: add support for deflate and gzip encodings, and handle 'nocompression' option
				headers["Accept-Encoding"] = "identity";// "deflate, gzip";
				var bodyEncoding = (options.bodyEncoding === "ascii" ? "ascii" : "utf8");
				if (bodyEncoding === 'ascii') {
					headers["Content-Length"] = (body && body.length) || 0;
				} else {
					headers["Content-Length"] = (body && bufferModule.Buffer.byteLength(body)) || 0;
				}
				headers.Accept = "*/*";
				headers['Content-Type'] = "application/x-www-form-urlencoded";
				headers.Date = (new Date()).toUTCString();

				// TODO: Add "expect 100" support for large POST operations?

				// Allow the caller to set/override any headers they want
				Object.keys(options.headers || {}).forEach( function (headerName) {
					headers[headerName] = options.headers[headerName];
				});
				// console.log("Headers: " + JSON.stringify(headers));

				var requestPath = parsed.pathname || "/";
				if (parsed.search) {
					requestPath = requestPath + parsed.search;
				}

				var local_result = {
					responseText: ""
				};

				var response = {
					statusCode: 200,
					headers: {}
				}
				local_result.status = response.statusCode;
				local_result.getResponseHeader = function(name) {
					var lowerCaseName = name.toLowerCase();
					if (lowerCaseName === 'set-cookie') {
						// set-cookie headers returned
						// as an array so convert to
						// comma-separated string
						return response.headers['set-cookie'].join(', ');
					} else {
						return response.headers[lowerCaseName];
					}
				};
				local_result.getAllResponseHeaders = function(name) {
					if (!local_result.allHeaders) {
						// Concat all the headers together as a string if they
						// haven't already been
						var headers = [];
						for (var key in response.headers) {
							if (response.headers.hasOwnProperty(key)) {
								headers.push("" + key + ": " + response.headers[key]);
							}
						}
						local_result.allHeaders = headers.join('\r\n');
					}
					return local_result.allHeaders;
				}; 
				//if the caller passed an onResponse function, call it with the status code and response headers
				if (options.onResponse && typeof options.onResponse === "function") {
					options.onResponse(response.statusCode, response.headers);
				}
				
				var psearch = (typeof(parsed.search) !== 'undefined' ? qs.parse(parsed.search.replace("?", "")) : "");
				// method, requestPath, headers, body, bodyEncoding
				//console.log("Locating url=" + url + " \nmethod=" + method +" \nrequestPath=" + requestPath)
				//console.log("ajaxCallCollection"+ajaxCallCollection.locate);
				var responseResult = ajaxCallCollection.locate({
					method: method,
					url: parsed.protocol + "//" + parsed.host + parsed.pathname || "/",
					requestPath: requestPath,
					headers: headers,
					body: body,
					bodyEncoding: bodyEncoding,
					parsedQueryString : psearch
				});
				
				console.log('>>>>>>>>>>AJAX Response' + JSON.stringify(responseResult));
				function parseTextResult(_response) {
					//console.log("Parsing text result")
					local_result.responseText = _response;
					try {			
						local_result.responseJSON = JSON.parse(_response);
					} catch(exception) {
						//igonre error because probably the response is a string and not JSON
					}
				}
				
				function parseObjectResult(_response) {
					//console.log("Parsing object result");
					local_result.responseText = JSON.stringify(_response);
					local_result.responseJSON = _response;					
				}
				
				function parseResponseResult(_response) {
					var resp = _response;
					if (_response.response) {
						resp = _response.response; 
					}
					
					if( typeof(resp) === 'string') {
						parseTextResult(resp);
					} else {
						parseObjectResult(resp);						
					}
					
					if (_response.headers) {
						//console.log("Result headers detected")
						response.headers = _response.headers; 
					}
					try {
				      //if the caller passed an onData function, call it with the current chunk of data
				      if (options.onData && typeof options.onData === "function") {
				      	var fstr = options.onData.toString();
				      	// this is needed for the facebook contacts sync
				      	if( fstr.indexOf('fs.writeSync') === -1)
							setTimeout(function() { options.onData(responseResult); }, 100);
				      }
				    } catch(exc) { console.log(JSON.stringify(exc)); }
				}
				
				parseResponseResult(responseResult);
				// simulate an asynchronous ajax call to the server
				setTimeout(function(){future.result = local_result}, 0);
			} catch(exc) {
				console.log('Caught error in ajaxCall!');
				console.error(JSON.stringify(exc));
			}
		});
	},
	/**
	 * Cancel an ajax call that is in progress
	 * @method cancel
	 * @param {Future} future The future that was returned by the call to an AjaxCall method
	 */
	cancel: function(future) {
		if (future._response) {
			future._response.removeAllListeners();
			future._response.connection.destroy();
			delete future._response;
		}
	}
}

AjaxCall.RequestMethod = {};
AjaxCall.RequestMethod.POST = "POST";
AjaxCall.RequestMethod.GET = "GET";
AjaxCall.RequestMethod.HEAD = "HEAD";