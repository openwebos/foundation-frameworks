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

var BufferedStream = exports.BufferedStream = Class.create(Stream,
{
	initialize: function(stream, bufferSize)
	{
		this._stream = stream;
		this._sbuffer = Buffer.create(bufferSize || 4096);
	},
	
	read: function(buffer, offset, length)
	{
		var sbuffer = this._sbuffer;
		buffer.position = offset;

		var count = sbuffer.available;
		if (length < count)
		{
			count = length;
		}
		if (count > 0)
		{
			sbuffer.copyTo(buffer, count);
			sbuffer.position += count;
			length -= count;
		}
		if (length == 0)
		{
			return new Future(count);
		}
		else 
		{
			sbuffer.shift(sbuffer.length);
			if (length >= sbuffer.capacity)
			{
				return this._stream.read(buffer, offset + count, length).then(this, function(future)
				{
					future.result += count;
				});
			}
			else
			{
				return this._stream.read(sbuffer, 0, sbuffer.capacity).then(this, function(future)
				{
					sbuffer.position = 0;
					length = future.result < length ? future.result : length;
					sbuffer.copyTo(buffer, length);
					sbuffer.position += length;
					future.result = length + count;
				});
			}
		}
	},
	
	write: function(buffer, offset, length)
	{
		var sbuffer = this._sbuffer;
		buffer.position = offset;
		
		var count = sbuffer.space;
		if (length < count)
		{
			count = length;
		}
		if (count > 0)
		{
			buffer.copyTo(sbuffer, count);
			length -= count;
		}
		
		if (length == 0)
		{
			return new Future(count);
		}
		else
		{
			return this._stream.write(sbuffer, 0, sbuffer.length).then(this, function(future)
			{
				sbuffer.shift(future.result);
				if (length >= sbuffer.capacity)
				{
					future.nest(this._stream.write(buffer, offset + count, length)).then(this, function()
					{
						future.result += count;
					});
				}
				else
				{
					buffer.copyTo(sbuffer, length);
					future.result = length + count;
				}
			});
		}
	},
	
	close: function()
	{
		return this.flush().then(this, function(future)
		{
			future.nest(this._stream.close());
		});
	},
	
	flush: function()
	{
		var sbuffer = this._sbuffer;
		switch (sbuffer._reset())
		{
			case 1:
				sbuffer.shift(sbuffer.length);
				// fall through
			case undefined:
				return this._stream.flush();
			case 2:
				return this._stream.write(sbuffer, 0, sbuffer.length).then(this, function(future)
				{
					sbuffer.shift(future.result);
					if (sbuffer.length != 0)
					{
						throw new IOError();
					}
					future.nest(this._stream.flush());
				});
		}
	},
	
	seek: function(offset, origin)
	{
		return this.flush().then(this, function(future)
		{
			future.nest(this._stream.seek(offset, origin));
		});
	},
	
	get canRead()
	{
		return this._stream.canRead;
	},
	
	get canWrite()
	{
		return this._stream.canWrite;
	},
	
	get canSeek()
	{
		return this._stream.canSeek;
	},
	
	get length()
	{
		return this._stream.length;
	},
	
	get position()
	{
		return this._stream.position;
	},
	
	get _buffer()
	{
		return this._sbuffer;
	},
});