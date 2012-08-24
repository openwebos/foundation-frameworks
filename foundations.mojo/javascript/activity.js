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

var Activity = Class.create(
{
	initialize: function(scene)
	{
		this._alisteners = [];
		this._listeners = [];
		
		var se = scene.controller.sceneElement;
		var self = this;
		this.$addEventListener(se, Mojo.Event.activate, function()
		{
			self.$onActivate();
		});
		this.$addEventListener(se, Mojo.Event.deactivate, function()
		{
			self.$onDeactivate();
		});
	},
	
	cleanup: function()
	{
		this._listeners.forEach(function(l)
		{
			l.element.removeEventListener(l.type, l.fn, l.capture);
		});
	},
	
	$addEventListener: function(element, type, fn, capture)
	{
		element.addEventListener(type, fn, capture);
		this._listeners.push({ element: element, type: type, fn: fn, capture: capture });
	},
	
	$addActivatedEventListener: function(element, type, fn, capture)
	{
		this._alisteners.push({ element: element, type: type, fn: fn, capture: capture });
	},
	
	$onActivate: function()
	{
		this._alisteners.forEach(function(l)
		{
			l.element.addEventListener(l.type, l.fn, l.capture);
		});
	},
	
	$onDeactivate: function()
	{
		this._alisteners.forEach(function(l)
		{
			l.element.removeEventListener(l.type, l.fn, l.capture);
		});
	}
});
