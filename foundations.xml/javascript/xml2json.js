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

/*global exports, SAXDriver */
exports.xmlstr2json = function(str)
{
	var stack = [];
	stack.unshift({});
	var driver = new SAXDriver();
	driver.setDocumentHandler(
	{
		processingInstruction: function(name, data)
		{
			if (stack.length == 1 && name == "xml")
			{
				data = data.split(" ");
				for (var i = 0; i < data.length; i++)
				{
					var pair = data[i].split("=");
					stack[0][pair[0]] = pair[1].replace(/'/g, '');
				}
			}
		},

		startElement: function(name, attrs)
		{
			name = name.replace(':', '$');
			var elem = {};
			var len = attrs.getLength();
			for (var i = 0; i < len; i++)
			{
				elem[attrs.getName(i).replace(':', '$')] = attrs.getValue(i);
			}
			var curr = stack[0][name];
			if (Object.prototype.toString.call(curr) == '[object Array]')
			{
				curr.push(elem);
			}
			else if (curr)
			{
				stack[0][name] = [ curr, elem ];
			}
			else
			{
				stack[0][name] = elem;
			}
			stack.unshift(elem);
		},

		endElement: function()
		{
			stack.shift();
		},

		characters: function(data, start, length)
		{
			if (stack[0].$t) {
				stack[0].$t = stack[0].$t + data.substr(start, length);
			} else {
				stack[0].$t = data.substr(start, length);
			}
		}
	});
	driver.parse(str);
	return stack[0];
};

exports.xmldom2json = function(xmldom)
{
	function node2json(jnode, xnode)
	{
		var name = xnode.nodeName.replace(':', '$');
		switch (xnode.nodeType)
		{
			case 1: // Element
				var jchild = {};
				if (Object.prototype.toString.call(jnode[name]) == '[object Array]')
				{
					jnode[name].push(jchild);
				}
				else if (jnode[name])
				{
					jnode[name] = [ jnode[name], jchild ];
				}
				else
				{
					jnode[name] = jchild;
				}
				var attributes = xnode.attributes;
				var len = attributes.length;
				for (var i = 0; i < len; i++)
				{
					var item = attributes.item(i);
					jchild[item.name] = item.value;
				}
				for (var xchild = xnode.firstChild; xchild; xchild = xchild.nextSibling)
				{
					node2json(jchild, xchild);
				}
				break;

			case 2: // Attribute
				jnode[name] = xnode.nodeValue;
				break;

			case 3: // Text
				var val = xnode.nodeValue;
				if (val.search(/\S/) != -1)
				{
					jnode.$t = val;
				}
				break;

			case 9: // Document
				node2json(jnode, xnode.firstChild);
				break;

			case 8: // Comment
				break;
			default:
				break;
		}
		return jnode;
	}
	return node2json({}, xmldom);
};

exports.xml2json = function(xml)
{
	if (typeof xml == "string")
	{
		return exports.xmlstr2json(xml);
	}
	else
	{
		return exports.xmldom2json(xml);
	}
};
