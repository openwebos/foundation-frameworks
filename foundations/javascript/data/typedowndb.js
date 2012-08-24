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

function TypedownDB(kind, orderBy, wordKeys, filter)
{
	this._kind = kind;
	this._sortKey = orderBy;
	this._wordKeys = wordKeys;
	this._limit = (filter && filter.limit) || 50;
	this._trim = (filter && filter.trim) || this._limit;
	this._style = (filter && filter.style) || "words";
}

TypedownDB.prototype.__proto__ = DB;

TypedownDB.prototype.putKind = function putKind(id, owner, indexes)
{
	if (id && id != this._kind)
	{
		throw new Error("Attemping to putKind incompatible kind: found ", id + ", requires " + this._kind);
	}
	indexes.push({ props: [{ name: "typedown" }] });
	DB.putKind(this._kind, owner, indexes);
};
	
TypedownDB.prototype.put = function put(objs)
{
	var len = objs.length;
	for (var i = 0; i < len; i++)
	{
		this._addTypedown(objs[i]);
	}
	return DB.put(objs);
};
	
TypedownDB.prototype.merge = function merge(objs, properties)
{
	if (Object.prototype.toString.call(objs) == "[object Array]")
	{
		var len = objs.length;
		for (var i = 0; i < len; i++)
		{
			this._addTypedown(objs[i]);
		}
	}
	return DB.merge(objs, properties);
};
	
TypedownDB.prototype.find = function find(query, watch, count)
{
	query = query || {};
	if (query.from && query.from != this._kind)
	{
		throw new Error("Attemping to query incompatible kind: found ", query.from + ", requires " + this._kind);
	}
	if (query.orderBy && query.orderBy != this._sortKey)
	{
		throw new Error("Attemping to orderBy incompatible key: found ", query.orderBy + ", requires " + this._sortKey);
	}
	query.from = this._kind;
	query.orderBy = this._sortKey;
	return DB.find(query, watch, count);
};
	
TypedownDB.prototype.search = function search(words)
{
	words = this._cleanWords(words);
	return DB.find({ from: this._kind, where: [ { prop: "typedown", op: "%", val: words } ], limit: this._limit }).then(this, function(future)
	{
		// Sort the results using the sort key.
		//  Append the id to the sort values to force them to be unique
		var s = this._sortKey;
		var r = future.result;
		r.sort(function(a, b)
		{
			a = a[s] + a._id;
			b = b[s] + b._id;
			return a < b ? -1 : a == b ? 0 : 1;
		});
		
		// Remove duplicates from the sorted results
		//  We trim the results to a specific length
		var lid = "";
		var results = [];
		var len = r.length;
		var t = this._trim;
		for (var i = 0; i < len; i++)
		{
			var item = r[i];
			var id = item._id;
			if (id != lid)
			{
				results.push(item);
				if (--t <= 0)
				{
					break;
				}
				lid = id;
			}
		}
		future.result = results;
	});
};
	
TypedownDB.prototype._addTypedown = function _addTypedown(obj)
{
	if (obj._kind && obj._kind != this._kind)
	{
		throw new Error("Attempting to put incompatible kind: found ", obj._kind + ", requires " + this._kind);
	}
	obj._kind = this._kind;
	var words = [];
	var klen = this._wordKeys.length;
	for (var k = 0; k < klen; k++)
	{
		var val = obj[this._wordKeys[k]];
		if (val)
		{
			switch (this._style)
			{
				case "words":
				default:
					this._addWords(words, val);
					break;
					
				case "letters":
					this._addLetters(words, val);
					break;
			}
			
		}
	}
	if (words.length)
	{
		obj.typedown = words;
	}
};
	
TypedownDB.prototype._cleanWords = function _cleanWords(line)
{
	return line.replace(/[.!?,()-]/, " ").replace(/\s+/, " ").toLowerCase();
};

TypedownDB.prototype._addWords = function _addWords(keys, line)
{
	line = this._cleanWords(line);
	for (;;)
	{
		keys.push(line);
		var idx = line.indexOf(" ");
		if (idx == -1)
		{
			break;
		}
		line = line.slice(idx + 1);
	}
	return keys;
};

TypedownDB.prototype._addLetters = function _addLetters(keys, line)
{
	line = this._cleanWords(line);
	while (line.length > 0)
	{
		if (line.charAt(0) != " ")
		{
			keys.push(line);
		}
		line = line.substring(1);
	}
	return keys;
};
