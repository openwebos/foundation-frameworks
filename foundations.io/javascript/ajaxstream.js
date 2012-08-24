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

var AjaxStream = exports.AjaxStream = Class.create(Stream,
{
	initialize: function(ajax)
	{
		this._curl = ajax;
	},
	
	flush: function()
	{
		return new Future(true);
	},
	
	close: function()
	{
		return new Future(true);
	},
	
	seek: function(offset, origin)
	{
		throw new IOError("Cannot seek a CURL stream");
	},
	
	read: function(buffer, offset, length)
	{
		var curl = this._curl;
		return new Future().now(function(future)
		{
			if (curl._complete)
			{
				future.result = 0;
			}
			else
			{
				curl.onread = function()
				{
					try
					{
						curl.pause();
						curl.onread = undefined;
						buffer.position = offset;
						future.result = curl.readUsingBuffer(buffer, length);
					}
					catch (e)
					{
						future.exception = new IOError(e.message);
					}
				}
				curl.resume();
			}
		});
	},
	
	write: function(buffer, offset, length)
	{
		throw new IOError("Cannot write to a CURL stream");
	}
});