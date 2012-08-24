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

/*
 * A version of MapReduce using Futures.
 *
 * map() must return a Future.
 * reduce() must return a Future and accept an array of objects where each is:
 * { item: <original data>, result: <normal result>, exception: <error result> }
 * (only 'result' or 'exception' is present, never both)
 *
 * Any exceptions in map() are propagated to reduce() and the returned future by
 * default. To suppress or otherwise override this behavior, implement reduce().
 *
 */
var mapReduce = exports.Control.mapReduce = function(config, data)
{
	return new Future().now(function(future) 
	{
		var map = config.map || passthru;
		var reduce = config.reduce || passthruWithExceptions;
		var len = data ? data.length : 0;
		var count = len + 1;
		var results = [];
		for (var i = 0; i < len; i++)
		{
			map(data[i]).then(data[i], function(mapFuture) 
			{
				var wrapped = { item: this };
				try
				{
					wrapped.result = mapFuture.result;
				}
				catch (e)
				{
					wrapped.exception = e;
				}

				results.push(wrapped);

				--count || future.nest(reduce(results));
			});
		}
		--count || future.nest(reduce(results));
		
		function passthru(v)
		{
			return new Future().immediate(v);
		}
		
		function passthruWithExceptions(results)
		{
			var f = new Future();
			// find the first exception and propagate that (can't really propagate all)
			for (var i = 0; i < results.length; i++)
			{
				if (results[i].exception)
				{
					f.exception = results[i].exception;
					return f;
				}
			}
			return f.immediate(results);
		}
	});
};
