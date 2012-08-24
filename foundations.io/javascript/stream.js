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

var Stream = exports.Stream = Class.create(
{
	read: function()
	{
		throw new IOError("Read not implemented");
	},
	
	write: function()
	{
		throw new IOError("Write not implemented");
	},
	
	close: function()
	{
		throw new IOError("Close not implemented");
	},
	
	flush: function()
	{
		throw new IOError("Flush not implemented");
	},
	
	seek: function()
	{
		throw new IOError("Seek not implemented");
	},
	
	copyTo: function(stream, bufferSize)
	{
		var count = 0;
		var buffer = Buffer.create(bufferSize);
		bufferSize = buffer.capacity;
		return new Future().now(this, function repeat(future)
		{
			future.nest(this.read(buffer, 0, bufferSize)).then(this, function()
			{
				if (future.result > 0)
				{
					count += future.result;
					future.nest(stream.write(buffer, 0, future.result)).then(this, repeat);
				}
				else
				{
					future.result = count;
				}
			})
		});
	},
	
	get canRead()
	{
		throw new IOError("canRead not implemented");
	},
	
	get canWrite()
	{
		throw new IOError("canWrite not implemented");
	},
	
	get canSeek()
	{
		throw new IOError("canSeek not implemented");
	},
	
	get length()
	{
		throw new IOError("length not implemented");
	},
	
	get position()
	{
		throw new IOError("position not implemented");
	},
});