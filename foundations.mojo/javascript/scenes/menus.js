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

var Menus = Class.create(
{
	initialize: function(scene)
	{
		var div = scene.controller.sceneElement;
		this._appmenu = this._setupMenu(scene, div, Mojo.Menu.appMenu, '.appmenu');
		this._commandmenu = this._setupMenu(scene, div, Mojo.Menu.commandMenu, '.commandmenu');
	},
	
	cleanup: function()
	{
		if (this._appmenu)
		{
			this._appmenu.removeEventListener('DOMSubtreeModified');
		}
		if (this._commandmenu)
		{
			this._commandmenu.removeEventListener('DOMSubtreeModified');
		}
	},
	
	_setupMenu: function(scene, div, menutype, menuclassname)
	{
		// Find the menu
		var menudiv = div.querySelector(menuclassname);
		if (menudiv)
		{
			// Build the initial menu model from the DOM tree and set it up
			var model = { items: this._buildMenuLevel(menudiv.firstChild, scene) };
			scene.controller.setupWidget(menutype, { omitDefaultItems: true, }, model);
		
			// Watch for any changes to the DOM menu, and rebuild the model if necessary
			var self = this;
			menudiv.addEventListener('DOMSubtreeModified', function()
			{
				model.items = self._buildMenuLevel(prefix, menudiv.firstChild, scene);
				scene.controller.modelChanged(model);
			});
		}
		return menudiv;
	},
	
	_buildMenuLevel: function(child, cmdiface)
	{
		var items = [];
		for (; child; child = child.nextSibling)
		{
			if (child.tagName == 'DIV')
			{
				var fchild = child.firstChild;
				if (fchild.nextSibling)
				{
					items.push({ label: fchild.nodeValue, items: this._buildMenuLevel(fchild.nextSibling, cmdiface) });
				}
				else
				{
					var action = child.getAttribute('x-mojo-action') || 'default';
					var shortcut;
					switch (action)
					{
						case Mojo.Menu.cutCmd:
							shortcut = 'x';
							break;
						case Mojo.Menu.copyCmd:
							shortcut = 'c';
							break;
						case Mojo.Menu.pasteCmd:
							shortcut = 'v';
							break;
						case Mojo.Menu.selectAllCmd:
							shortcut = 'a';
							break;
						default:
							break;
					}
					items.push({ label: fchild.nodeValue, icon: (fchild.tagName == "IMG" ? fchild.src : undefined), shortcut: shortcut, command: action, checkEnabled: true });
				}
			}
		}
		return items;
	},
});