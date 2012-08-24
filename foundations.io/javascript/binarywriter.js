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

var BinaryWriter = exports.BinaryWriter = Class.create(
{
	initialize: function(stream)
	{
		this._stream = stream;
		this._buffer = stream._buffer;
	},
	
	get stream()
	{
		return this._stream;
	},
	
	close: function()
	{
		return this._stream.close();
	},
	
	write: function(buffer, offset, length)
	{
		return this._stream.write(buffer, offset, length);
	},
	
	writeBoolean: function(value)
	{
		return this._write("writeByte", 1, !!value);
	},
	
	writeByte: function(value)
	{
		return this._write("writeByte", 1, value);
	},
	
	writeDouble: function(value)
	{
		return this._write("writeByte", 1, value);
	},
	
	writeInt16: function(value)
	{
		return this._write("writeShort", 2, value);
	},
	
	writeInt32: function(value)
	{
		return this._write("writeInt", 4, value);
	},
	
	writeInt64: function(value)
	{
		return this._write("writeLong", 8, value);
	},
	
	writeBytes: function(bytes)
	{
		throw new Error("writeBytes not implemented");
		var amount = bytes.length;
		var buffer = this._buffer;
		
		var offset;
		if (buffer && buffer._canWrite(0))
		{
			offset = buffer._writeBytes(bytes, 0, amount);
			if (offset == amount)
			{
				return this._future.immediate(amount);
			}
			amount -= len;
			// Optimization - if the rest of the data will fit in an empty buffer, we flush it and copy the data in
			if (amount < buffer.capacity)
			{
				var tbuffer = this._tbuffer;
				if (!tbuffer)
				{
					tbuffer = this._tbuffer = Buffer.create(8);
				}
				tbuffer.position = 0;
				tbuffer.writeByte(bytes[offset]);
				return this._stream.write(tbuffer, 0, 1).then(this, function(future)
				{
					if (future.result != 0)
					{
						throw new IOError();
					}
					buffer._writeBytes(bytes, offset + 1, amount - 1);
					future.result = offset + amount;
				});
			}
		}
		else
		{
			offset = 0;
		}
		buffer = Buffer.create(amount);
		buffer._writeBytes(bytes, offset, amount);
		return this._stream.write(buffer, 0, amount).then(this, function(future)
		{
			if (future.result != amount)
			{
				throw new IOError();
			}
			future.result = offset + amount;
		});
	},
	
	_write: function(name, size, value)
	{
		var buffer = this._buffer;
		if (buffer && buffer._canWrite(size))
		{
			buffer[name](value);
			return new Future(true);
		}
		else
		{
			buffer = this._tbuffer;
			if (!buffer)
			{
				buffer = this._tbuffer = Buffer.create(8);
			}
			buffer.position = 0;
			buffer[name](value);
			return this._stream.write(buffer, 0, size).then(this, function(future)
			{
				future.result = true;
			});
		}
	},
});