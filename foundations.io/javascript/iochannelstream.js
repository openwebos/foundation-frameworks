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

var IOChannelStream = Class.create(Stream,
{
	initialize: function()
	{
		throw new Error("IOChannelStream is abstract");
	},
	
	flush: function()
	{
		return new Future().now(this, function(future)
		{
			try
			{
				this._channel.flush();
				future.result = true;
			}
			catch (e)
			{
				throw new IOError(e.message);
			}
		});
	},
	
	close: function()
	{
		return this.flush().then(this, function(future)
		{
			//this._channel.close();
			future.result = true;
		})
	},
	
	seek: function(offset, origin)
	{
		return this.flush().then(this, function(future)
		{
			try
			{
				future.result = this._channel.seek(offset, origin);
			}
			catch (e)
			{
				throw new IOError(e.message);
			}
		});
	},
	
	read: function(buffer, offset, length)
	{
		var channel = this._channel;
		return new Future().now(function(future)
		{
			channel.onread = function()
			{
				try
				{
					channel.onread = undefined;
					buffer.position = offset;
					future.result = channel.readUsingBuffer(buffer, length);
				}
				catch (e)
				{
					future.exception = new IOError(e.message);
				}
			}
		});
	},
	
	write: function(buffer, offset, length)
	{
		return new Future().now(this, function(future)
		{
			try
			{
				buffer.position = offset;
				future.result = this._channel.writeUsingBuffer(buffer, length);
			}
			catch (e)
			{
				throw new IOError(e.message);
			}
		});
	}
});