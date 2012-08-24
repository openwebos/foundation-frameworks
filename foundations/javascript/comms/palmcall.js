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

/*global exports, Future, Assert, webOS, Mojo, Err, console */
var PalmCall = exports.Comms.PalmCall =
{
	_pending: {},
	_id: 1,
	
	_callMojo: function(url, cmd, args)
	{
		var self = this;
		return new Future().now(function(future)
		{
			var id = self._id++;
			future.pending = new Mojo.Service.Request(url,
			{
				method: cmd,
				parameters: args || {},
				onSuccess: future.callback(function(payload)
				{
					self._pending[id] = undefined;
					future.result = payload;
				}),
				onFailure: future.callback(function(payload)
				{
					self._pending[id] = undefined;
					throw Err.create(payload.errorCode || -1, payload.errorText || "Unknown PalmCall failure", payload.exception);
				})
			});
			future.palmCallId = id;
			self._pending[id] = future;
		});
	},
	
	_cancelMojo: function(future)
	{
		this._pending[future.palmCallId] = undefined;
		future.pending.cancel();
	},
	
	_callTriton: function(url, cmd, args)
	{		
		return new Future().now(this, function(future)
		{
			Assert.requireString(url, "PalmCall.call: url parameter must be a string, was #{type}",{type: typeof url});
			Assert.requireString(cmd, "PalmCall.call: cmd parameter must be a string, was #{type}",{type: typeof cmd});
			Assert.requireJSONObject(args, "PalmCall.call: args parameter must be a valid JSON object, was #{type}", {type: typeof args});
			
			if(cmd.length > 0){
				if(url.charAt(url.length-1)!="/"){
					url+="/";
				}
				url=url+cmd;
			}

			if (!this._handle)
			{
				console.error("Foundations.PalmCall: Service bus handle not set! Use PalmCall.register(handle) to set up a bus handle");
				this._handle = new webOS.Handle("", false);
			}
			//console.log(url, JSON.stringify(args));
			var callFn;
			if (args.subscribe===true || args.watch===true) {
				//console.log("PalmCall: Using call");
				callFn = this._handle.call;
			} else {
				//console.log("PalmCall: Using callOneReply");
				callFn = this._handle.callOneReply;
			}
			future.pending = callFn.call(this._handle, url, JSON.stringify(args), future.callback(function(response)
			{
				//console.log("--", response.payload());
				if (future.pending)
				{
					var payload;
					var err;
					try {
						payload = JSON.parse(response.payload());
					} catch(e) {
						err = Err.create(-1, 'PalmCall.call: Bad JSON in service message from '+response.applicationID()+'('+response.sender()+'): "'+response.payload()+'"', e);
						err.response = payload;
						throw err;
					}
					if (payload.returnValue === false || payload.errorCode || payload.errorText)
					{
						err = Err.create(payload.errorCode || -1, url + " " + JSON.stringify(args) + ": " + (payload.errorText || "Unknown PalmCall failure"), payload.exception);
						err.response = payload;
						throw err;
					}
					else
					{
						future.result = payload;
					}
				}
			}));
		});
	},
	
	_cancelTriton: function(future)
	{
		this._handle.cancel(future.pending);
		future.pending = undefined;
	},

	_registerTriton: function(handle, name) {
		// TODO: figure out how to juggle multiple handles for more
		// than one service per service app
		//console.log("SAVING HANDLE "+handle);
		if (typeof this._handle !== 'undefined') {
			throw new Error("_registerTriton: don't call this function more than once");
		}
		this._handle = handle;
	},
	
	_callNode: function(url, cmd, args) {
		return new Future().now(this, function(future)
		{
			Assert.requireString(url, "PalmCall.call: url parameter must be a string, was #{type}",{type: typeof url});
			Assert.requireString(cmd, "PalmCall.call: cmd parameter must be a string, was #{type}",{type: typeof cmd});
			Assert.requireJSONObject(args, "PalmCall.call: args parameter must be a valid JSON object, was #{type}", {type: typeof args});
			// NOV-95340: Append a / to the URI if a command is specified
			if(cmd.length > 0){
				if(url.charAt(url.length-1)!="/"){
					url+="/";
				}
				url=url+cmd;
			}

			if (!this._handle)
			{
				console.error("Foundations.PalmCall: Service bus handle not set! Use PalmCall.register(handle) to set up a bus handle");
				this._handle = new PalmBus.Handle("", false);
			}
			//console.log(url, JSON.stringify(args));
			var callFn;
			if (args.subscribe===true) {
				//console.log("PalmCall: Using subscribe");
			    callFn = this._handle.subscribe;
			} else if(args.watch===true) {
				//console.log("PalmCall: Using watch");
				callFn = this._handle.watch;
			} else {
				//console.log("PalmCall: Using call");
				callFn = this._handle.call;
			}
			future.pending = callFn.call(this._handle, url, JSON.stringify(args));
			future.pending.addListener('response', future.callback(function(response)
			{
				var payload;
				var err;
				try {
					payload = JSON.parse(response.payload());
				} catch(e) {
					err = Err.create(-1, 'PalmCall.call: Bad JSON in service message from '+response.applicationID()+'('+response.sender()+'): "'+response.payload()+'"', e);
					err.response = payload;
					throw err;
				}
				if (payload.returnValue === false || payload.errorCode || payload.errorText)
				{
					err = Err.create(payload.errorCode || -1, url + " " + JSON.stringify(args) + ": " + (payload.errorText || "Unknown PalmCall failure"), payload.exception);
					err.response = payload;
					throw err;
				}
				else
				{
					future.result = payload;
				}
			}));
		});
	},

	_cancelNode: function(future)
	{
	    if (future.pending) {
    		future.pending.cancel();	        
	    }
		future.pending = undefined;
	},

	_registerNode: function(handle, name) {
		// TODO: figure out how to juggle multiple handles for more
		// than one service per service app
		//console.log("SAVING HANDLE "+handle);
		if (typeof this._handle !== 'undefined') {
			throw new Error("_registerNode: don't call this function more than once");
		}
		this._handle = handle;
	},

	setup: function() {
		// Select the call method depending if we're server or client.
		if (!EnvironmentUtils.isBrowser())
		{
		    if (EnvironmentUtils.isTriton()) {
    			PalmCall.call = PalmCall._callTriton;
    			PalmCall.cancel = PalmCall._cancelTriton;
    			PalmCall.register = PalmCall._registerTriton;		        
		    } else {
				PalmBus = require('palmbus');
    			PalmCall.call = PalmCall._callNode;
    			PalmCall.cancel = PalmCall._cancelNode;
    			PalmCall.register = PalmCall._registerNode;		        
		    }
		}
		else
		{
			PalmCall.call = PalmCall._callMojo;
			PalmCall.cancel = PalmCall._cancelMojo;
			PalmCall.register = function() {};
		}
	}

};
