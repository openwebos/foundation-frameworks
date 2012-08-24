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

/*globals exports, Class, Foundations, jsonQuery, console */

/*
 * Transform data between two data representations using a template.
 *  A template contains a set of transformations - usually 'to' and 'from'.
 *  When we want to transform some data, we use the create a transformer with
 *  a template and a selection (e.g. 'to').  We then call the transform method
 *  which transforms the data to the new format.
 *
 *  A simple template might look as follows:
 *  {
 *    "to": { name: "!{displayName}", type: "first" }
 *  }
 *  The !{...} indicates an jsonPath expression which should be evaluated for the given data.
 *  If displayName is 'Fred' then the result would be:
 *  { name: "Fred", type: "first" }
 */
var Transformer = exports.Transformer = Class.create(
{
	/*
	 * Create a data transformer using a template and a direction.
	 *  A template contains a set of named transforms, typically 'to' and 'from'.
	 *  When we create a transformer, we select which of the transforms in a template
	 *  we are going to use.  This transform is then used for all other operations.
	 */
	initialize: function(transform)
	{
		this._transformCache = {};
		this._transform = transform;
	},
	
	/*
	 * Transform the given data to the new format.
	 */
	transform: function(data)
	{
		return this._populateTemplate(data, this._transform);
	},
	
	/*
	 * Merge the new data into the old data.
	 */
	merge: function(olddata, newdata)
	{
		return this._mergeThing(olddata, newdata, this._transform);
	},
	
	/*
	 * Transform the new data and merge it with the old data.
	 */
	transformAndMerge: function(olddata, newdata)
	{
		return this.merge(olddata, this.transform(newdata));
	},
	
	_populateTemplate: function(from, template)
	{
		var self = this;
		return Foundations.ObjectUtils.clone(template, { ignoreEmptyObjects: true, ignoreEmptyArrays: true, ignoreFunctions: false, ignorePartialObjects: true }, function(node, path)
		{
			if (node)
			{
				if (typeof node === "function")
				{
					return node(from);
				}
				else if (Object.prototype.toString.call(node) === "[object String]" && node.charAt(0) == '!')
				{
					return self._expandExpr(from, node.substring(1));
				}
			}
			return node;
		});
	},
	
	_expandExpr: function(data, expr)
	{
		function transform(regexp, q, val)
		{
			var matches = regexp.exec(q(val));
			return matches ? matches[1] || matches[0] : "";
		}
		var self = this;
		var ret = expr.replace(/\{([^{]*)\}/g, function($0, $1)
		{
			var q = self._transformCache[$1];
			if (!q)
			{
				if ($1.slice(-1) == '/')
				{
					var cmds = $1.split('/');
					cmds.pop();
					var regexp = cmds.pop();
					q = transform.curry(new RegExp(regexp), jsonQuery(cmds.join('/')));
				}
				else
				{
					q = jsonQuery($1);
				}
				self._transformCache[$1] = q;
			}
			try
			{
				return q(data) || '';
			}
			catch (_)
			{
				return '';
			}
		});
		if (ret.search(/\S/) != -1)
		{
			return ret;
		}
		else
		{
			return undefined;
		}
	},
	
	_mergeThing: function(to, from, mask)
	{
		// Merging into ourself - does nothing
		if (to === from)
		{
			return undefined;
		}
		else switch (Foundations.ObjectUtils.type(from))
		{
			case 'boolean':
			case 'null':
			case 'undefined':
			case 'number':
			case 'string':
				return from;
				
			// case 'function':
			default:
				return undefined;
				
			case 'array':
				if (to && Object.prototype.toString.call(to) === "[object Array]")
				{
					return this._mergeArray(to, from, mask);
				}
				else
				{
					return from;
				}
				break;
				
			case 'object':
				if (to)
				{
					var changed = false;
					/*jslint forin: true */
					for (var key in from)
					{
						var val = this._mergeThing(to[key], from[key], mask ? mask[key] : undefined);
						if (val !== undefined)
						{
							to[key] = val;
							changed = true;
						}
					}
					/*jslint forin: false */
					return changed ? to : undefined;
				}
				else
				{
					return from;
				}
		}
	},
	
	_mergeArray: function(to, from, mask, state)
	{
		// Merging arrays is complicated.  Essentially, we want to add the new array content to the old array content
		// in such a way that we replace objects which should be replaced, but add objects if they should be added.
		// We do this by using the original template (here or mask) to determine what is important when we're looking for
		// a match between the arrays.  Essentially we ignore any generated values (strings prefixed with !) and key the
		// match by looking for sentinals in the 'from' which match those in the 'to'.  We do not have to have a complete
		// match ('to' can contains things that are not in 'from') but all others must match
		var flen = from.length;
		var tlen = to.length;
		var changed = false;
		var i, j, fmask, fi;
		for (i = 0; i < flen; i++)
		{
			fi = from[i];
			fmask = (mask && mask[i]) || fi;
			var dopush = true;
			for (j = 0; j < tlen; j++)
			{
				if (this._mergeMatch(to[j], fi, fmask))
				{
					var val = this._mergeThing(to[j], fi, fmask);
					if (val !== undefined)
					{
						to[j] = val;
						changed = true;
					}
					dopush = false;
					break;
				}
			}
			if (dopush)
			{
				to.push(fi);
				changed=true;
			}
		}
		// delete "to" items with no matching "from" item
		j=0;
		while(j<to.length) {
			var dosplice=true;
			for (i=0; i<flen; i++) {
				fi = from[i];
				fmask = (mask && mask[i]) || fi;
				if (this._mergeMatch(to[j], fi, fmask)) {
					dosplice=false;
					break;
				}
			}
			if (dosplice) {
				to.splice(j, 1);
				changed=true;
			} else {
				j++;
			}
		}
		return changed ? to : undefined;
	},
	
	_mergeMatch: function(to, from, mask)
	{
		var fLen,
		tLen,
		i,
		j,
		matchFound = true;
		
		switch (Foundations.ObjectUtils.type(mask))
		{
			case 'boolean':
			case 'undefined':
			case 'null':
			case 'number':
				return to == from;
				
			case 'string':
				return to == from || mask.charAt(0) == '!';
				
			case 'object':
				if (!to)
				{
					return false;
				}
				else
				{
					for (var key in mask)
					{
						if (!this._mergeMatch(to[key], from[key], mask[key]))
						{
							return false;
						}
					}
					return true;
				}
				break;
				
			case 'array':
				if (!to) {
					return false;
				}
				fLen = from.length;
				tLen = to.length;				
				if (fLen === 0 && tLen === 0) {
					return true;
				}				
				if (fLen !== tLen) {
					return false;
				}				
				for (i=0;i<fLen;i++) {
					matchFound = false;
					fmask = (mask && mask[i]) || fi;
					for (j=0;j<tLen;j++) {
						matchFound = matchFound || this._mergeMatch(to[j], from[i], fmask);
						if (matchFound) {
							break;
						}
					}
					if (!matchFound) {
						break;
					}
				}

				return matchFound;
			// case 'function':
			default:
				return false;
		}
	}
});

/*
 * Generate a difference between old data and new data.  Essentially a skeleton object
 * is constructed which only contains the properties which are different from the older data.
 * Not strictly a transform/merge property, but generating differences is necessary to transform
 * and merge just the changes.
 */
Transformer.difference = function(olddata, newdata)
{
	return Foundations.ObjectUtils.clone(newdata, { ignoreEmptyObjects: true, ignoreEmptyArrays: true, ignoreFunctions: true }, function(node, path)
	{
		var other = jsonQuery(path, olddata);
		if (other === node)
		{
			return undefined;
		}
		else
		{
			return node;
		}
	});
};
