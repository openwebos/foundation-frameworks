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

var eventMap;

function initEventMap()
{
	return (eventMap = 
	{
		element: 				{ type: "element" },
		widget: 				{ type: "element", modelchanged: true, canlisten: true },
		html: 					{ type: "element" },
		css: 					{ type: "element" },
		show: 					{ type: "element" },
		sliderDragStart: 		{ type: "event", type: "event", event: Mojo.Event.sliderDragStart },
		sliderDragEnd: 			{ type: "event", type: "event", event: Mojo.Event.sliderDragEnd },
		scrolled: 				{ type: "event", event: Mojo.Event.scrolled },
		scrollStarting: 		{ type: "event", event: Mojo.Event.scrollStarting },
		hold: 					{ type: "event", event: Mojo.Event.hold },
		holdEnd: 				{ type: "event", event: Mojo.Event.holdEnd },
		tap: 					{ type: "event", event: Mojo.Event.tap },
		singleTap: 				{ type: "event", event: Mojo.Event.singleTap },
		keyup: 					{ type: "event", event: Mojo.Event.keyup },
		keydown: 				{ type: "event", event: Mojo.Event.keydown },
		keypress: 				{ type: "event", event: Mojo.Event.keypress },
		back: 					{ type: "command", event: Mojo.Event.back },
		forward: 				{ type: "command", event: Mojo.Event.forward },
		menu: 					{ type: "menu", event: Mojo.Event.command },
		//commandenable: 			null,
		dragStart: 				{ type: "event", event: Mojo.Event.dragStart },
		dragging: 				{ type: "event", event: Mojo.Event.dragging },
		dragEnd: 				{ type: "event", event: Mojo.Event.dragEnd },
		listChange: 			{ type: "event", event: Mojo.Event.listChange },
		listTap: 				{ type: "event", event: Mojo.Event.listTap },
		listAdd: 				{ type: "event", event: Mojo.Event.listAdd },
		listDelete: 			{ type: "event", event: Mojo.Event.listDelete, attr: { swipeToDelete: true } },
		listReorder: 			{ type: "event", event: Mojo.Event.listReorder, attr: { reorderable: true } },
		propertyChange: 		{ type: "event", event: Mojo.Event.propertyChange },
		//revealbottom: 			null,
		aboutToActivate: 		{ type: "scene", event: Mojo.Event.aboutToActivate },
		activate: 				{ type: "scene", event: Mojo.Event.activate },
		stageDeactivate: 		{ type: "stage", event: Mojo.Event.deactivate },
		stageActivate: 			{ type: "stage", event: Mojo.Event.activate },
		deactivate: 			{ type: "scene", event: Mojo.Event.deactivate },
		//subtreehidden: 			null,
		//subtreeshown: 			null,
		//commitchanges: 			null,
		flick: 					{ type: "event", event: Mojo.Event.flick },
		filter: 				{ type: "event", event: Mojo.Event.filter },
		filterImmediate: 		{ type: "event", event: Mojo.Event.filterImmediate }, 
		//biglistselected: 		null,
		//peoplepickerselected: 	null,
		//comboboxsearch: 		null,
		//comboboxselected: 		null,
		//comboxboxentered: 		null,
		//imageviewchanged: 		null,
		//propertychanged: 		null,
		progressCancelled:		{ type: "event", event: Mojo.Event.cancel },
		progressComplete: 		{ type: "event", event: Mojo.Event.progressComplete },
		progressIconTap: 		{ type: "event", event: Mojo.Event.progressIconTap },
		//orientationchange: 		null,
		fsm: 					{ type: "fsm" },
	});
}