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

var MemoryStream = exports.MemoryStream = Class.create(Stream,
{
	initialize: function(initialiSize)
	{
		this._mbuffer = Buffer.create(initialSize);
		this._future = new Future();
	},
	
	read: function(buffer, offset, length)
	{
		var available = this._mbuffer.available
		if (length > available)
		{
			length = available;
		}
		buffer.offset = offset;
		this._mbuffer.copyTo(buffer, available);
		return this._future.immediate(available);
	},
	
	write: function(buffer, offset, length)
	{
		buffer.offset = offset;
		buffer.copyTo(this._mbuffer, length);
		return this._future.immediate(length);
	},
	
	close: function()
	{
		return this._future.immediate(true);
	},
	
	flush: function()
	{
		return this._future.immediate(true);
	},
	
	seek: function(offset, origin)
	{
		switch (origin)
		{
			case SeekOrigin.begin:
			default:
				break;
			case SeekOrigin.current:
				offset += this._mbuffer.position;
				break;
			case SeekOrigin.end:
				offset += this._mbuffer.length;
				break;
		}
		this._mbuffer.position = offset;
		return this._future.immediate(offset);
	},
	
	get canRead()
	{
		return true;
	},
	
	get canWrite()
	{
		return true;
	},
	
	get canSeek()
	{
		return true;
	},
	
	get length()
	{
		return this._mbuffer.length;
	},
	
	get position()
	{
		return this._mbuffer.position;
	},
	
	get _buffer()
	{
		return this._mbuffer;
	}
});