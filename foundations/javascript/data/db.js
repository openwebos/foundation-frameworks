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

/*global exports, Future, PalmCall, console */
var DB = exports.Data.DB =
{
	get: function(ids)
	{
		if (ids.length === 0)
		{
			return new Future({returnValue: true, results:[]});
		}
		else
		{
			return this.execute("get", { ids: ids });
		}
	},
	
	put: function(objects)
	{
		if (objects.length === 0)
		{
			return new Future({returnValue: true, results:[]});
		}
		else
		{
			return this.execute("put", { objects: objects });
		}
	},
	
	find: function(query, watch, count)
	{
		return this.execute("find", { query: query, watch: watch, count: count });
	},
	
	del: function(idsOrQuery, purge)
	{
		var arg;
		if (Object.prototype.toString.call(idsOrQuery) == "[object Array]")
		{
			if (idsOrQuery.length === 0)
			{
				return new Future({returnValue: true, results:[]});
			}
			else
			{
				arg = { ids: idsOrQuery };
			}
		}
		else
		{
			arg = { query: idsOrQuery, purge: (!!purge) };
		}
		return this.execute("del", arg);
	},
	
	merge: function(objectsOrQuery, properties)
	{
		var arg;
		if (Object.prototype.toString.call(objectsOrQuery) == "[object Array]")
		{
			if (objectsOrQuery.length === 0)
			{
				return new Future({returnValue: true, results:[]});
			}
			else
			{
				arg = { objects: objectsOrQuery };
			}
		}
		else
		{
			arg = { query: objectsOrQuery, props: properties };
		}
		return this.execute("merge", arg);
	},
	
	reserveIds: function(count)
	{
		if (count === 0)
		{
			return new Future({returnValue: true, ids:[]});
		}
		else
		{
			return this.execute("reserveIds", { count: count });
		}
	},
	
	putKind: function(id, owner, indexes)
	{
		return this.execute("putKind", { id: id, owner: owner, indexes: indexes });
	},
	
	delKind: function(id)
	{
		return this.execute("delKind", { id: id });
	},
	
	execute: function(cmd, args)
	{
		if (!this.temp) {
			return PalmCall.call("palm://com.palm.db/", cmd, args);
		} else {
			return PalmCall.call("palm://com.palm.tempdb/", cmd, args);
		}
	}
};

var tempDBFactory = function() {
	this.temp = true;
};
tempDBFactory.prototype = DB;

var TempDB = exports.Data.TempDB = new tempDBFactory();
