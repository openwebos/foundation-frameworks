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

/*global exports, Err, PalmCall, Future, console */
function Activity(name, description, isBackground)
{
	this._trace("initialize", arguments);
	this._activity = { 
		name: name, 
		description: description
	};
	if (isBackground) {
		this._activity.type = {
			 background: true
		};
	} else {
		this._activity.type = {
			 foreground: true
		};
	}
	this._refcount = 1;
	this._owner = undefined;
	this._subscription = undefined;
	this.lastEvent = Activity.Event.start;
	this.serial = undefined; // ActivityManager provides a serial number on callbacks
	this.name = name;
}

Activity.prototype = {	
	_service : "palm://com.palm.activitymanager/",
	_log : false,
	_trace : function(name, args) {
		if (this._log) {
			var s = "activity.js -> Activity."+name+"(";
			var first=true;
			for (var i=0; i < args.length; i++) {
				if (!first) {
					s+=", ";
				} else {
					first = false;
				}
				s+=args[i];
			}
			s+=")";
			console.log(s);
		}
	},
	
	create: function()
	{
		this._trace("create", arguments);
		if (this._activityId)
		{
			throw Err.create(-1, "Cannot create an activity if one has already been created");
		}
		else
		{
			return this._create(false);
		}
	},

	start: function(method)
	{
		this._trace("start", arguments);
		if (this._activityId)
		{
			return PalmCall.call(this._service, "start", { activityId: this._activityId });
		}
		else
		{
			return this._create(true);
		}
	},

	_create: function(start)
	{
		this._trace("_create", arguments);
		return new Future().now(this, function(outer)
		{
			var shouldSubscribe = (this._activity.callback === undefined);
			this._subscription = PalmCall.call(this._service, "create", { activity: this._activity, start: start, replace: this._replace, subscribe: shouldSubscribe }).then(this, function(future)
			{
				this._activityId = future.result.activityId;
				this._owner = true;
				var result = future.result;
				outer.result = result;
				this._monitor();
				if (result.event)
				{
					this._updateState(result.event);
				}
			});
		});
	},
		
	adopt: function(activityId)
	{
		this._trace("adopt", arguments);
		if (this._subscription)
		{
			throw Err.create(-1, "Cannot adopt an activity if one has already been created");
		}
		return new Future().now(this, function(outer)
		{
			this.name = "ActivityManager activity"+activityId;
			this._activityId = activityId;
			var args = { activityId: this._activityId, subscribe: true };
			if (this.serial) {
				args.serial = this.serial;
			}
			this._subscription = PalmCall.call(this._service, "adopt", args).then(this, function(future)
			{
				// Currently ActivityManager initially responds with {"activityId":xxx,"event":"orphan","returnValue":true}
				// so check for that result as well.
				if (future.result.adopted || (future.result.event && future.result.event === "orphan"))
				{
					this._owner = true;
				}
				outer.result = future.result;
				this._monitor();
			}, 
			function(future) {
				// propagate error status from inner PalmCall to outer future.
				outer.setException(future.exception);
			});
		});
	},
	
	monitor: function(activityId)
	{
		this._trace("monitor", arguments);
		if (this._subscription)
		{
			console.warn("Shouldn't call monitor() when already subscribed.");
			return new Future(this.lastEvent);
		}
		return new Future().now(this, function(outer)
		{
			this.name = "Monitored activityID"+activityId;
			this._activityId = activityId;
			this._subscription = PalmCall.call(this._service, "monitor", { activityId: this._activityId, subscribe: true }).then(this, function(future) {
				//console.log("monitor responded");
				outer.result = future.result;
				this._monitor();
			},
			function(future) {
				// propagate error status from inner PalmCall to outer future.
				outer.setException(future.exception);
			});
		});
	},
	
	/* Completes or unsubscribes, depending on whether we're the owner */
	complete:  function(restart)
	{
		this._trace("complete", [this.name]);
		this._refcount = 0;
		if (this._owner)
		{
			var options = { activityId: this._activityId };
			if (restart) {
				options.restart = true;
			}
			if (this.serial) {
				options.serial = this.serial;
			}
			return PalmCall.call(this._service, "complete", options).then(this, function(future)
			{
				if (this._subscription !== undefined)
				{
					this._trace("unsubscribe(owned)", []);
					//this._subscription.cancel();
					PalmCall.cancel(this._subscription);
					this._subscription = undefined;
				}
				future.result = future.result;
			});
		}
		else
		{
			if (restart) {
				console.error("Tried to complete&restart an activity we don't own - "+this._activityId);
			}
			if (this._subscription !== undefined)
			{
				this._trace("unsubscribe(not owned)", []);
				//this._subscription.cancel();
				PalmCall.cancel(this._subscription);
				this._subscription = undefined;
			}
			return undefined;
		}
	},
	
	cancel: function()
	{
		this._trace("cancel", arguments);
		this._refcount = 0;
		return PalmCall.call(this._service, "cancel", { activityId: this._activityId });
	},
	
	setTrigger: function(key, url, params)
	{
		this._trace("setTrigger", arguments);
		this._activity.trigger = { method: url, key: key, params: params };
		return this;
	},
	
	setScheduleInterval: function(interval, within)
	{
		this._trace("setScheduleInterval", arguments);
		this._activity.schedule = { interval: interval, within: within };
		return this;
	},
	
	setScheduleTime: function(start, end, within)
	{
		this._trace("setScheduleTime", arguments);
		this._activity.schedule = { start: start, end: end, within: within };
		return this;
	},
	
	setRequirements: function(requirements)
	{
		this._trace("setRequirements", arguments);
		this._activity.requirements = requirements;
		return this;
	},
	
	setCallback: function(url, params)
	{
		this._trace("setCallback", arguments);
		this._activity.callback = { method: url, params: params };
		return this;
	},
	
	setUserInitiated: function(val)
	{
		this._trace("setUserInitiated", arguments);
		this._activity.type.userInitiated = val;
		return this;
	},
	
	setExplicit: function(val)
	{
		this._trace("setExplicit", arguments);
		this._activity.type.explicit = val;
		return this;
	},

	setPersist: function(val)
	{
		this._trace("setPersist", arguments);
		this._activity.type.persist = val;
		return this;
	},

	setReplace: function(val)
	{
		this._trace("setReplace", arguments);
		this._replace = val;
		return this;
	},
	
	setPower: function(val)
	{
		this._trace("setPower", arguments);
		this._activity.type.power = val;
		return this;
	},

	setPowerDebounce: function(val)
	{
		this._trace("setPowerDebounce", arguments);
		this._activity.type.powerDebounce = val;
		return this;
	},

	setMetadata: function(data)
	{
		this._trace("setMetadata", arguments);
		this._activity.metadata = data;
		return this;
	},

	onEvent: function(callback)
	{
		this._trace("onEvent", arguments);
		if (this._eventCallback)
		{
			throw Err.create(-1, "Only supports one callback");
		}
		else
		{
			this._eventCallback = callback;
		}
	},
	
	_monitor: function()
	{
		this._trace("_monitor", arguments);
		if (!this._subscription) {
			console.warn("Foundations.activity: _monitor with no subscription active - probably completed already");
			return;
		}
		this._subscription.then(this, function update(future)
		{
			this._trace("update ", [JSON.stringify(future.result)]);
			try
			{
				var result = future.result;
				if (this._subscription) {
				    this._subscription.then(this, update);
    				this._updateState(result.event);
			    }
			}
			catch (e)
			{
				// Monitoring failed
				console.error("Activity monitoring failed: activityId=" + this._activityId + ", activity=" + JSON.stringify(this._activity));
				console.error("exception was: "+e.stack);
			}
		});
	},
	
	_updateState: function(event)
	{
		this._trace("_updateState", [event]);
		this.lastEvent = event;
		
		// Handle adoption/orphaning
		if (event == Activity.Event.orphan)
		{
			this._owner = true;
		}
		else if (event == Activity.Event.adopted)
		{
			this._owner = false;
		}
		else if (event == Activity.Event.stop || event == Activity.Event.cancel || event == Activity.Event.complete)
		{
			this._trace("_updateStatus: cancelling subscription", []);
			//this._subscription.cancel();
			PalmCall.cancel(this._subscription);
			this._subscription = undefined;
		}
		
		// Dispatch event if someone is listening
		if (this._eventCallback && event)
		{
			this._eventCallback(event);
		}
	}
};

Activity.Event =
{
	start: "start",
	stop: "stop",
	pause: "pause",
	cancel: "cancel",
	orphan: "orphan",
	adopted: "adopted",
	focused: "focused",
	unfocused: "unfocused",
	running: "running",
	"yield": "yield",
	complete: "complete" // Pseudo-event
};
exports.Control.Activity = Activity;
