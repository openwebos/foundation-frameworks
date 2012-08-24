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

var BinaryReader = exports.BinaryReader = Class.create(
{
	initialize: function(stream, endian)
	{
		this._future = new Future();
		this._stream = stream;
		this._buffer = stream._buffer;
	},
	
	get stream()
	{
		return this._stream;
	},
	
	close: function()
	{
		this._stream.close();
	},
	
	read: function(buffer, offset, length)
	{
		return this._stream.read(buffer, offset, length);
	},
	
	readBoolean: function()
	{
		return this._read("_readBool", 1);
	},
	
	readByte: function()
	{
		return this._read("readByte", 1);
	},
	
	readDouble: function()
	{
		return this._read("readDouble", 8);
	},
	
	readInt16: function()
	{
		return this._read("readShort", 2);
	},
	
	readInt32: function()
	{
		return this._read("readInt", 4);
	},
	
	readInt64: function()
	{
		return this._read("readLong", 8);
	},
	
	readSByte: function()
	{
		return this._read("_readSByte", 1);
	},
	
	readString: function()
	{
		throw new Error("Not implemented yet");
	},
	
	readUInt16: function()
	{
		return this._read("readUShort", 2);
	},
	
	readUInt32: function()
	{
		return this._read("readUInt", 4);
	},
	
	readUInt64: function()
	{
		return this._read("readULong", 8);
	},
	
	readline: function () {
		var newline = "\n".charCodeAt(0);
		var chars = [];
		var lineFuture = new Future();
		function send_line() {
			if (chars.length > 0) {
				var s = String.fromCharCode.apply(undefined, chars);
				chars = [];
				lineFuture.result = s;
			} else {
				//console.log("NO LAST LINE!");
				lineFuture.result = false;
			}
		}
		function error(future) {
			//console.log("error");
			if (future.exception.name === "EOSError") {
				send_line();
				future.result=false;
			} else {
				console.log("ERROR!");
				throw future.exception;
			}
		}

		function got_byte(future) {
			var b = future.result;
			if (!b) {
				console.log("FALSE");
			}
			//console.log(String.fromCharCode(b));
			chars.push(b);
			if (b === newline) {
				send_line();
			} else {
				this.readByte().then(this, got_byte, error);
			}
		}

		this.readByte().then(this, got_byte, error);
		return lineFuture;
	},
	
	readBytes: function(amount)
	{
		var bytes = [];
		var buffer = this._buffer;
		if (buffer && buffer._canRead(0))
		{
			amount -= buffer._readBytes(bytes, 0, amount);
			if (amount == 0)
			{
				return this._future.immediate(bytes);
			}
			// Optimization - if the rest of the data will come from a full buffer, we fill it and copy the data out
			else if (amount < buffer.capacity)
			{
				var tbuffer = this._tbuffer;
				if (!tbuffer)
				{
					tbuffer = this._tbuffer = Buffer.create(8);
				}
				return this._stream.read(tbuffer, 0, 1).then(this, function(future)
				{
					if (future.result > 0)
					{
						buffer.position = 0;
						buffer._readBytes(bytes, 0, amount);
					}
					future.result = bytes;
				});
			}
		}
		buffer = Buffer.create(amount);
		return this._stream.read(buffer, 0, amount).then(this, function(future)
		{
			if (future.result + bytes.length == 0)
			{
				throw new EOSError();
			}
			if (future.result < amount)
			{
				amount = future.result;
			}
			buffer.position = 0;
			buffer._readBytes(bytes, 0, amount);
			future.result = bytes;
		});
	},
	
	_read: function(name, size)
	{
		var buffer = this._buffer;
		if (buffer && buffer._canRead(size))
		{
			return this._future.immediate(buffer[name]());
		}
		else
		{
			var tbuffer = this._tbuffer;
			if (!tbuffer)
			{
				tbuffer = this._tbuffer = Buffer.create(8);
			}
			return this._stream.read(tbuffer, 0, size).then(this, function(future)
			{
				if (future.result == 0)
				{
					throw new EOSError();
				}
				tbuffer.position = 0;
				future.result = tbuffer[name]();
			});
		}
	},
});