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
 * The Model provides a mechanism to update the watch for changes to objects.
 * When a model is updated, the changes are propograted to any listeners.  However, for
 * efficiency, only active scenes and stages will receieve the update notifications
 * immediately.  Any listeners which is inactive will only receive the changes when they
 * are about to become active.  The goal is to prevent changes progating to inactive scenes
 * when they could cause excessive work which is not immediately useful.
 */

var Model = exports.Model =
{
	_token: 1,
	_allscenes: { controller: {} },

	update: function(scene, model, properties, force)
	{
		return this._update(scene, model, properties, force, false);
	},
	
	delay: function()
	{
		var self = this;
		return {
			update: function(scene, model, properties, force)
			{
				self._update(scene, model, properties, force, true);
			},
			
			finish: function(scene)
			{
				self._sendPending(scene);
				self._sendPending(self._allscenes);
			}
		};
	},
	
	create: function(scene, model)
	{
		this._notifyListeners({ type: 'create', model: model, diff: {}, who: scene}, model, false);
	},
	
	remove: function(scene, model)
	{
		this._notifyListeners({ type: 'remove', model: model, diff: this.merge({}, model).old, who: scene }, model, false);
	},
	
	merge: function(model, properties, force)
	{
		var modified = false;
		var old = {};
		if (properties) 
		{
			// Copy properties (ignorning _private names and functions)
			for (var key in properties) 
			{
				if (key.charAt(0) != '_') 
				{
					var val = properties[key];
					if (!Object.isFunction(val)) 
					{
						var oval = model[key];
						if (oval === null || oval === undefined || val === null || val === undefined || typeof val == "boolean" || typeof val == "number" || Object.isString(val) || Object.isArray(val)) 
						{
							if (oval != val || force) 
							{
								old[key] = oval;
								model[key] = val;
								modified = true;
							}
						}
						else
						{
							var r = this.merge(oval, val, force);
							if (r.modified) 
							{
								old[key] = r.old;
								modified = true;
							}
						}
					}
				}
			}
		}
		//Mojo.Log.info("MERGE %j %j %j", model, properties, old);
		return {
			modified: modified,
			old: old
		};
	},
	
	setParent: function(model, parent)
	{
		model._webos$foundations$model$parent = parent;
	},
	
	addListener: function(scene, model, observer)
	{
		// Every model with listeners holds a set of scenes which are listening to it
		if (!model._webos$foundations$model$listeners) 
		{
			model._webos$foundations$model$listeners = {};
		}
		
		if (!scene)
		{
			scene = this._allscenes;
		}

		if (!scene._webos$foundations$model$pending) 
		{
			this._setupScene(scene);
		}
		scene._webos$foundations$model$count++;
		
		// Find the calls info related to this specific model+scene combination - creating if necessary
		var info = model._webos$foundations$model$listeners[scene._webos$foundations$model$token];
		if (!info) 
		{
			info = { who: scene, pending: null, call: [] };
			model._webos$foundations$model$listeners[scene._webos$foundations$model$token] = info;
		}
		info.call.push(observer);
	},
	
	removeListener: function(scene, model, observer)
	{
		if (!scene)
		{
			scene = this._allscenes;
		}
		if (model._webos$foundations$model$listeners && scene._webos$foundations$model$token) 
		{
			var info = model._webos$foundations$model$listeners[scene._webos$foundations$model$token];
			if (info) 
			{
				if (observer) 
				{
					for (var i = 0; i < info.call.length; i++)
					{
						if (info.call[i] === observer)
						{
							info.call.splice(i, 1);
							scene._webos$foundations$model$count--;
							break;
						}
					}
				}
				else 
				{
					scene._webos$foundations$model$count = 0;
					info.call = [];
				}
			}
			if (scene._webos$foundations$model$count == 0)
			{
				//Mojo.Log.info("CLEANUP", scene._webos$foundations$model$token);
				this._cleanupScene(scene);
			}
		}
	},
	
	_update: function(scene, model, properties, force, delay)
	{
		if (properties === undefined && force === undefined) 
		{
			force = true;
		}
		var r = this.merge(model, properties, force);
		if (force || r.modified) 
		{
			this._notifyListeners({ type: 'update', model: model, diff: r.old, who: scene }, model, delay);
		}
		return r.modified;
	},
	
	_notifyListeners: function(event, target, delay)
	{
		var listeners = target._webos$foundations$model$listeners;
		if (listeners) 
		{
			for (var scenetoken in listeners) 
			{
				if (scenetoken == 'toJSON')
				{
					continue;
				}
				var listener = listeners[scenetoken];
				if (listener.call) 
				{
					var ctrl = listener.who.controller;
					if (!delay && (!ctrl || !ctrl.isActive || ctrl.isActive() || event.who == listener.who)) 
					{
						//Mojo.Log.info("Sending event now");
						for (var i = 0; i < listener.call.length; i++)
						{
							listener.call[i](event);
						}
					}
					else 
					{
						//Mojo.Log.info("Queueing event %d %d %o", listener.who._webos$foundations$model$pending.length, listener.who._webos$foundations$model$token, listener.pending);
						var pending = listener.pending;
						if (!pending)
						{
							pending = {};
							listener.pending = pending;
						}
						var modeltoken = event.model._webos$foundations$model$token;
						var cevent = pending[modeltoken];
						if (!cevent)
						{
							cevent = {};
							for (var k in event)
							{
								cevent[k] = event[k];
							}
							cevent.diff = {};
							for (var k in event.diff)
							{
								cevent.diff[k] = event.diff[k];
							}
							pending[modeltoken] = cevent;
							listener.who._webos$foundations$model$pending.push(listener);
						}
						else
						{
							if (event.type == 'remove')
							{
								cevent.type = 'remove';
							}
							for (var k in event.diff)
							{
								cevent.diff[k] = event.diff[k];
							}
							if (event.who != cevent.who)
							{
								cevent.who = null; // If different scenes update, we cannot provide an explicit scene when we callback
							}
						}
					}
				}
			}
		}
		
		// Notify parent if we have one
		if (target._webos$foundations$model$parent)
		{
			this._notifyListeners(event, target._webos$foundations$model$parent, false);
		}
	},
	
	_sendPending: function(scene)
	{
		//Mojo.Log.info("sendPending %d", scene._webos$foundations$model$token);
		var pending = scene._webos$foundations$model$pending;
		if (pending) 
		{
			scene._webos$foundations$model$pending = [];
			var len = pending.length;
			//Mojo.Log.info("Sending %d pending events", len);
			for (var i = 0; i < len; i++) 
			{
				var listener = pending[i];
				var events = listener.pending;
				listener.pending = undefined;
				for (var modeltoken in events) 
				{
					listener.call(events[modeltoken]);
				}
			}
		}
	},
	
	_setupScene: function(scene)
	{
		scene._webos$foundations$model$token = this._token++;
		scene._webos$foundations$model$pending = [];
		scene._webos$foundations$model$count = 0;
		if (scene.controller.sceneElement) 
		{
			if (!this._aboutToActivateBound)
			{
				var self = this;
				this._aboutToActivateBound = function(event)
				{
					self._sendPending(event.target._webos$foundations$scene);
				}
			}
			scene.controller.sceneElement._webos$foundations$scene = scene;
			scene.controller.sceneElement.addEventListener(Mojo.Event.aboutToActivate, this._aboutToActivateBound);
		}
	},
	
	_cleanupScene: function(scene)
	{
		if (scene.controller.sceneElement) 
		{
			scene.controller.sceneElement._webos$foundations$scene = undefined;
			scene.controller.sceneElement.removeEventListener(Mojo.Event.aboutToActivate, this._aboutToActivateBound);
		}
		scene._webos$foundations$model$pending = undefined;
		scene._webos$foundations$model$token = undefined;
		scene._webos$foundations$model$count = undefined;
	}
};
