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

/*global webOS, exports, Future, Err, MojoLoader, ObjectUtils, EnvironmentUtils, require, console */
var urlModule, httpModule, bufferModule;

/*$
 * @param {Object} options HTTP options.  Contains one or more of the following:
 *		bodyEncoding {String} Encoding of the body data.  Will accept 'ascii' or
 *			'utf8'; 'utf8' is the default.
 *
 *		customRequest {String} Specifies that a custom request method, e.g. 
 *			"PROPFIND", should be used instead of usual "GET" or "POST"
 *
 *		headers {Object} Hash of the headers to send in the request.
 *
 *		nocompression {Boolean} If 'true', accepted response encodings will not 
 *			include compressed formats.
 */
var AjaxCall =
{
	//default timeout for ajaxCall set to 60 seconds
	//TODO remove this when nodejs timeout is fixed
	ajaxCTimeout: null,
	ajaxCTimeoutValue: 60 * 1000,
	
	get: function(url, options)
	{
		return this.call(AjaxCall.RequestMethod.GET, url, undefined, options);
	},
	
	head: function(url, options)
	{
		return this.call(AjaxCall.RequestMethod.HEAD, url, undefined, options);
	},
	
	post: function(url, body, options)
	{
		return this.call(AjaxCall.RequestMethod.POST, url, body, options);
	},
	
	_callMojo: function(method, url, body, options)
	{
		return new Future().now(this, function(future)
		{
			options = options || {};
			method = method.toUpperCase();
			if (body && method === AjaxCall.RequestMethod.GET)
			{
				url = url + "?" + body;
				body = undefined;
			}
			var ajax = new XMLHttpRequest();
			ajax.open(method, url);
			if (options.headers)
			{
				for (var key in options.headers)
				{
					if (options.headers.hasOwnProperty(key)) {
						ajax.setRequestHeader(key, options.headers[key]);
					}
				}
			}
			ajax.onreadystatechange = future.callback(function()
			{
				if (ajax.readyState === 4 && !ajax._complete) // Complete
				{
					ajax._complete = true;
					if (ajax.status >= 200 && ajax.status < 300)
					{
						try
						{
							ajax.responseJSON = JSON.parse(ajax.responseText);
						}
						catch (_)
						{
							// Not JSON
						}
						future.result = ajax;
					}
					else
					{
						throw Err.create(ajax.status, ajax.statusText);
					}
				}
			});
			ajax.send(body);
			future._ajax = ajax;
		});
/* --------------------------------------
			new Ajax.Request(url,
			{
				method: method,
				postBody: body,
				requestHeaders: options.headers,
				evalJS: false,
				onSuccess: future.callback(this, function(response)
				{
					future.result = response;
				}),
				onFailure: future.callback(this, function(response)
				{
					throw new Error(response.status + ": " + response.statusText);
				}),
			});
		});
------------------------------------------- */
	},
	
	_cancelMojo: function(future)
	{
		future._ajax.abort();
	},
	
	_callTriton: function(method, url, body, options)
	{
		return new Future().now(this, function(future)
		{
			options = options || {};
			method = method.toUpperCase();
			if (body && method !== AjaxCall.RequestMethod.POST)
			{
				if (url.match("\\?")) {
					url = url + "&" + body;
				} else {
					url = url + "?" + body;
				}
				body = undefined;
			}
			//console.log(url);
			var handle = new webOS.Curl(url);
			if (options.headers)
			{
				handle.setHeaders(options.headers);
			}
			handle.setOption(webOS.Curl.SSL_VERIFYPEER, 0);
			handle.setOption(webOS.Curl.SSL_VERIFYHOST, 0);
			handle.setOption(webOS.Curl.FOLLOWLOCATION, 10);
			//handle.setOption(webOS.Curl.VERBOSE, 1);
			if (options.nocompression) {
				handle.setOption(webOS.Curl.ENCODING, "identity");
			}
			else {
				handle.setOption(webOS.Curl.ENCODING, ""); // all possible encodings
			}
			if (options.verbose) {
				handle.setOption(webOS.Curl.VERBOSE, 1);
			}
			if (options.onRead) {
				handle.onread = options.onRead;
			}
			// store all headers for later retrieval with getResponseHeader()
			var headers = {};
			var allHeaders = "";
			handle.onheader = function(header) {
				var colon = header.indexOf(": ");
				if (colon !== -1) {
					var key = header.substring(0, colon);
					var value = header.substring(colon+2,header.length-1);
					if (headers[key]) {
						// We've already seen this header; it should be an array now
						if (ObjectUtils.type(headers[key]) != "array") {
							headers[key] = [headers[key]];
						}
						headers[key].push(value);
					} else {
						headers[key] = value;
					}
					allHeaders += header;
					if (options.onHeader) {
						try
						{
							options.onHeader(key, value);
						}
						catch (e) 
						{
							console.log("onHeader error: "+e);
						}
					}
				}
			};
				
			switch (method)
			{
				case AjaxCall.RequestMethod.POST:
					if (options.customRequest) {
						handle.setOption(webOS.Curl.CUSTOMREQUEST, options.customRequest);
					}
					handle.post(
						body,
						future.callback(this, function(result)
						{
							//console.log("--", result);
							future._complete = true;
							var local_result = { responseText: result };
							local_result.getResponseHeader = function(name) {
								return headers[name];
							};
							local_result.getAllResponseHeaders = function(name) {
								return allHeaders;
							};
							try
							{
								local_result.responseJSON = JSON.parse(result);
							}
							catch (_)
							{
								// Not JSON
							}
							try {
								local_result.status=handle.getInfo(webOS.Curl.CURLINFO_RESPONSE_CODE);
							}
							catch (_)
							{
								// couldn't get status
							}
							future.result=local_result;
						}),
						future.callback(this, function(errorCode, errorMessage)
						{
							future._complete = true;
							throw Err.create(errorCode, errorMessage);
						})
					);
					break;
				
				case AjaxCall.RequestMethod.HEAD:
					handle.setOption(webOS.Curl.NOBODY, 1);
					handle.setOption(webOS.Curl.HEADER, 1);
					if (options.customRequest) {
						handle.setOption(webOS.Curl.CUSTOMREQUEST, options.customRequest);
					}
					handle.get(
						future.callback(this, function(result)
						{
							//console.log("--", result);
							future._complete = true;
							var local_result = { responseText: result };
							local_result.getResponseHeader = function(name) {
								return headers[name];
							};
							local_result.getAllResponseHeaders = function(name) {
								return allHeaders;
							};
							try {
								local_result.status=handle.getInfo(webOS.Curl.CURLINFO_RESPONSE_CODE);
							}
							catch (_)
							{
								// couldn't get status
							}
							future.result=local_result;
						}),
						future.callback(this, function(errorCode, errorMessage)
						{
							future._complete = true;
							throw Err.create(errorCode, errorMessage);
						})
					);
					break;
				case AjaxCall.RequestMethod.GET:
				default:
					if (options.customRequest) {
						handle.setOption(webOS.Curl.CUSTOMREQUEST, options.customRequest);
					}
					handle.get(
						future.callback(this, function(result)
						{
							//console.log("--", result);
							future._complete = true;
							var local_result = { responseText: result };
							local_result.getResponseHeader = function(name) {
								return headers[name];
							};
							local_result.getAllResponseHeaders = function(name) {
								return allHeaders;
							};
							try
							{
								local_result.responseJSON = JSON.parse(result);
							}
							catch (_)
							{
								// Not JSON
							}
							try {
								local_result.status=handle.getInfo(webOS.Curl.CURLINFO_RESPONSE_CODE);
							}
							catch (_)
							{
								// couldn't get status
							}
							future.result=local_result;
						}),
						future.callback(this, function(errorCode, errorMessage)
						{
							//console.log("-- AjaxCall.call error! " + errorCode + ", " + errorMessage);
							future._complete = true;
							throw Err.create(errorCode, errorMessage);
						})
					);
					break;
			}
			future._handle = handle;
			var self = this;
			future.getResponseStream = function()
			{
				return self._getResponseStream(future);
			};
		});
	},
	
	_foundations_io: undefined,
	
	_getResponseStream: function(future)
	{
		// Dynamially load the IO library which contains the AjaxStream class we use to stream data from the Ajax Curl connection.
		if (!this._foundations_io)
		{
			this._foundations_io = MojoLoader.require({ name: "foundations.io", version: "1.0" })["foundations.io"];
		}
		return new this._foundations_io.AjaxStream(future._handle);
	},
	
	_cancelTriton: function(future)
	{
		future._handle.abort();
	},

	_callNode: function(method, url, body, options) {
		return new Future().now(this, function(future) {
			options = options || {};
			// console.log("Options: " + JSON.stringify(options));
			method = method.toUpperCase();
			
			if (body && method !== AjaxCall.RequestMethod.POST)
			{
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
			var port = parseInt(parsed.port, 10) || ((secure) ? 443 : 80);
			
			// console.log("SECURE="+secure);
			// console.log("parsed = "+JSON.stringify(parsed));
			var httpClient = httpModule.createClient(port, parsed.host, secure);
			httpClient.addListener('error', function clientError(error) {
				future.exception = Err.create(error.errno, "httpClient error "+error.message);
			});
			
			
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
			Object.keys(options.headers || {}).forEach(function (headerName) {
				headers[headerName] = options.headers[headerName];
			});
			// console.log("Headers: " + JSON.stringify(headers));
			
			// console.log("pathname=" + parsed.pathname);
			var requestPath = parsed.pathname || "/";
			if (parsed.search) {
				requestPath = requestPath + parsed.search;
			}
			
			var local_result = { responseText: "" };
			// console.log("requesting path: " + requestPath);
			var request = httpClient.request(method, requestPath, headers);
			var that = this;
			
			request.addListener('error', function requestError(error) {
				that.clearAjaxCTimeout();
				future.exception = Err.create(error.errno, "httpRequest error "+error.message);
			});
			
			/*
			 * Set up the response handler for the request.
			 */
			request.addListener('response', function returnResponse(response) {
				// console.log("Response headers: " + JSON.stringify(response.headers));
				
				/*
				 * Handle the data we have now - the status code and the headers
				 */
				future._response = response;
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
				
				
				/*
				 * Add handlers for the "data", "error", and "end" events
				 */
				response.addListener('data', function addToResponseText(chunk) {
					local_result.responseText += chunk;
					
					//if the caller passed an onData function, call it with the current chunk of data
					if (options.onData && typeof options.onData === "function") {
						options.onData(chunk);
					}
				});
				
				response.addListener('error', function responseError(error) {
					//remove the ajaxCall timeout in case of error
					//console.log("Error in response. Clearing the AjaxCall timeout");					
					that.clearAjaxCTimeout();					
					future.exception = Err.create(error.errno, "httpResponse error " + error.message);
				});

				var done = false;

				function requestDone() {
					//remove the ajaxCall timeout when the call is finished
					//console.log("Request is finished. Clearing the AjaxCall timeout");
					that.clearAjaxCTimeout();
					
					if (done) {
						return;
					} 
					done = true;

					try {
						local_result.responseJSON = JSON.parse(local_result.responseText);
					} catch (parseError) {
						//ignore errors while parsing the response as JSON - it must not be a JSON response
					}
					future.result = local_result;
				}
				
				response.addListener('end', requestDone);
				response.addListener('close', requestDone);
			});
			
			//a new call is made so we have to clear the timeout
			//console.log("A new request is made. Clearing the AjaxCall timeout");
			this.clearAjaxCTimeout();
			//set the timeout before sending the request, and in case the request remains hanging
			//more than the timeout speciffied cancel the call and set an error message
			this.ajaxCTimeout = setTimeout(function() {
				future.exception = Err.create(504, "Timeout received from ajaxCall ");
				try {
					console.log("Ajax call timeout hit. Canceling the call.");
					that.clearAjaxCTimeout();
					AjaxCall.cancel(future);
				} catch(exception) {}
			}, this.ajaxCTimeoutValue);
			
			// console.log("Body (" + bodyEncoding + ", " + headers["Content-Length"] + "): " + body);
			request.end(body, bodyEncoding);
		});
	},
	
	_cancelNode: function (future) {
		// Remove listeners and close the socket
		if (future._response) {
			future._response.removeAllListeners();
			future._response.connection.destroy();
			delete future._response;
		}
	},
	
	setup: function() {
		// Select the call method depending if we're server or client.
		if (!EnvironmentUtils.isBrowser())
		{
			if (EnvironmentUtils.isTriton()) {
				AjaxCall.call = AjaxCall._callTriton;
				AjaxCall.cancel = AjaxCall._cancelTriton;
			}
			else
			{
				urlModule = require('url');
				httpModule = require('http');
				bufferModule = require('buffer');
				AjaxCall.call = AjaxCall._callNode;
				AjaxCall.cancel = AjaxCall._cancelNode;
			}
		}
		else
		{
			AjaxCall.call = AjaxCall._callMojo;
			AjaxCall.cancel = AjaxCall._cancelMojo;
		}
	},
	
	//set a custom timeout value for the call
	//timeout is is miliseconds
	setCallTimeout: function(timeout) {
		Assert.requireNumber(timeout, "AjaxCall.setCallTimeout: timeout parameter must be a number, was #{type}",{type: typeof timeout});
		//console.log("Setting the AjaxCall timeout to " + timeout + " seconds");
		this.ajaxCTimeoutValue = timeout;
	},
	
	clearAjaxCTimeout: function() {
		try {
			if (this.ajaxCTimeout) {
				clearTimeout(this.ajaxCTimeout);
				this.ajaxCTimeout = null;
			}
		} catch(exception) {
			console.log("AjaxCall exception on clear timeout" + exception);			
		}		
	}
};

AjaxCall.RequestMethod = {};
AjaxCall.RequestMethod.POST = "POST";
AjaxCall.RequestMethod.GET = "GET";
AjaxCall.RequestMethod.HEAD = "HEAD";

exports.Comms.AjaxCall = AjaxCall;
