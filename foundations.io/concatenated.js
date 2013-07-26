var MojoLoader=require('mojoloader.js');
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

var IMPORTS = MojoLoader.require(
	{ name: "foundations", version: "1.0" }
);
var Foundations = IMPORTS["foundations"];

var Class = Foundations.Class;
var Future = Foundations.Control.Future;


function MakeError(error)
{
	var e = function(message)
	{
		this.message = message;
	}
	e.prototype.name = error;
	e.prototype.toString = function()
	{
		return this.name + (this.message ? ": " + this.message : "");
	}
	this[error] = e;
}

MakeError("IOError");
MakeError("EOSError");
MakeError("SocketError");
MakeError("MissingSeekError");
MakeError("DirectoryNotFoundError");


var _extensions = 
{
	get available()
	{
		return this.length - this.position;
	},

	get space()
	{
		return this.capacity - this.length;
	},

	_reset: function()
	{
		var op = this._op;
		this._op = undefined;
		return op;
	},

	_canRead: function(size)
	{
		switch (this._op)
		{
			case undefined:
				this._op = 1;
				// fall through
			case 1:
				return size <= this.length - this.position;
			case 2:
				throw new MissingSeekError();
		}
	},

	_canWrite: function(size)
	{
		switch (this._op)
		{
			case 1:
				throw new MissingSeekError();
			case undefined:
				this._op = 2;
				// fall through
			case 2:
				return size < this.capacity;
		}
	},

	_readSByte: function()
	{
		var b = this.readByte();
		return b < 128 ? b : -256 | b;
	},

	_readBool: function()
	{
		return this.readByte() ? true : false;
	},

	_readBytes: function(array, offset, amount)
	{
		var available = this.available;
		if (available < amount)
		{
			amount = available;
		}
		for (var i = 0; i < amount; i++)
		{
			array[offset++] = this.readByte();
		}
		return amount;
	},

	_writeBytes: function(array, offset, amount)
	{
		var space = this.space;
		if (space < amount)
		{
			amount = space;
		}
		for (var i = 0; i < amount; i++)
		{
			this.writeByte(array[offset++]);
		}
		return amount;
	}
};

var Buffer = exports.Buffer =
{
	create: function(size)
	{
		if (_extensions)
		{
			webOS.Buffer.prototype.__proto__ = _extensions;
			_extensions = undefined;
		}
		return new webOS.Buffer(size);
	}
}


var SeekOrigin = exports.SeekOrigin =
{
	begin: 0,
	current: 1,
	end: 2,
}

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

var FileStream = exports.FileStream = Class.create(IOChannelStream,
{
	initialize: function(path, mode)
	{
		try
		{
			this._channel = new webOS.IOChannel.Channel(path, mode);
			this._channel.flags |= webOS.IOChannel.FLAG_NONBLOCK;
		}
		catch (e)
		{
			throw new IOError(e.message);
		}
	}
});

var NetworkStream = exports.NetworkStream = Class.create(IOChannelStream,
{
	initialize: function(socket)
	{
		try
		{
			this._socket = socket;
			this._channel = new webOS.IOChannel.channel(socket._socket.getDescriptor());
			this._channel.flags |= webOS.IOChannel.FLAG_NONBLOCK;
		}
		catch (e)
		{
			throw new IOError(e.message);
		}
	}
});

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

var File = exports.File =
{
	open: function(path, mode)
	{
		return new FileStream(path, mode);
	},
	
	remove: function(path)
	{
		throw new Error("Not implemented");
	},
	
	move: function(frompath, topath)
	{
		throw new Error("Not implemented");
	},
	
	exists: function(path)
	{
		var FTS = webOS.FTS;
		var fts = new FTS(path, FTS.FTS_LOGICAL | FTS.FTS_NOSTAT);
		var r = fts.read();
		fts.close();
		return r ? r.errno === 0 : false;
	},
	
	copy: function(to, from)
	{
		var ffrom = File.open(from, "r");
		var fto = File.open(to, "w");
		return ffrom.copyTo(fto).then(function()
		{
			ffrom.close();
			fto.close();
			future.result = future.result;
		});
	},
}

var SearchOptions = exports.SearchOptions =
{
	top: undefined,
	all: 1,
}

var Directory = exports.Directory =
{
	getFiles: function(path, pattern, options)
	{
		return new Future().now(function(future)
		{
			var FTS = webOS.FTS;
			var fts = new FTS(path, FTS.FTS_LOGICAL | FTS.FTS_NOSTAT);
			try
			{
				if (!fts.read())
				{
					throw new DirectoryNotFoundError(path);
				}
				var files = [];
				for (;;)
				{
					var file = fts.read();
					//if (file) for (var k in file) console.log(k, file[k]);
					if (!file)
					{
						break;
					}
					var dot = (file.name[0] === ".");
					if (file.directory && (options === SearchOptions.top || dot))
					{
						fts.set(FTS.FTS_SKIP);
					}
					if (!file.postorderDirectory && !dot && (!pattern || pattern.test(file.name)))
					{
						if (file.directory)
						{
							file.path += "/";
						}
						files.push(file.path);
					}
				}
				future.result = files;
			}
			finally
			{
				fts.close();
			}
		});
	}
};


var Socket = exports.Socket = Class.create(
{
	_states:
	{
		client: {},
		server: {},
	},
	
	initialize: function(domain, type, protocol)
	{
		try
		{
			this._socket = new webOS.Socket(domain, type, protocol);
		}
		catch (e)
		{
			throw new SocketError(e.message);
		}
	},
	
	bind: function(endpoint)
	{
		try
		{
			this._socket.bind(endpoint._sockaddr);
			this.localEndPoint = endpoint;
		}
		catch (e)
		{
			throw new SocketError(e.message);
		}
	},
	
	listen: function(qlen)
	{
		try
		{
			this._checkNotState(this._states.client);
			this._state = this._states.server;
			this._socket.listen(qlen);
		}
		catch (e)
		{
			throw new SocketError(e.message);
		}
	},
	
	connect: function(endpoint)
	{
		return new Future().now(this, function(future)
		{
			try
			{
				this._checkNotState(this._states.server);
				this._state = this._states.client;
				this._socket.connect(endpoint._sockaddr);
				this.remoteEndPoint = endpoint;
				future.result = true;
			}
			catch (e)
			{
				throw new SocketError(e.message);
			}
		});
	},
	
	accept: function()
	{
		return new Future().now(this, function(future)
		{
			this._checkNotState(this._states.client);
			this._state = this._states.server;
			try
			{
				var chan = this._acceptchan;
				if (!chan)
				{
					this._socket.setBlocking(false);
					chan = new webOS.IOChannel.Channel(this._socket.getDescriptor());
					this._acceptchan = chan;
				}
				chan.onread = function()
				{
					chan.onread = undefined;
					future.result = true;
				}
			}
			catch (e)
			{
				throw new SocketError(e.message);
			}
		}).then(this, function(future)
		{
			try
			{
				var info = this._socket.accept();
				info.socket.localEndPoint = this._socket.localEndPoint;
				info.socket.remoteEndPoint = new EndPoint(info.sockaddr.host, info.sockaddr.port);
				future.result = info.socket;
			}
			catch (e)
			{
				throw new SocketError(e.message);
			}
		});
	},
	
	close: function()
	{
		return new Future().now(this, function(future)
		{
			try
			{
				future.result = this._socket.close();
			}
			catch (e)
			{
				throw new SocketError(e.message);
			}
		});
	},
	
	_checkNotState: function(state)
	{
		if (this._states.server === state)
		{
			throw new SocketError();
		}
	}
});

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

var AddressFamily = exports.AddressFamily =
{
	Unix: 1,
	INet: 2,
	INet6: 30,
}

exports.SocketType = 
{
	Stream: 1,
	Dgram: 2,
}

exports.ProtocolType =
{
	Unix: 1,
	IPv4: 2,
	IPv6: 30,
};

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

/*global webOS,exports */

var Posix = 
{
	mkdir: function(path, permissions) {
		var p = permissions || 0777;
		var f = new Future();
		webOS.Posix.mkdir(path, p, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("mkdir("+path+"): "+response.message);
			}
		}));
		return f;
	},
	rmdir: function(path) {
		var f = new Future();
		webOS.Posix.rmdir(path, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("rmdir("+path+"): "+response.message);
			}
		}));
		return f;
	},
	unlink: function(path) {
		var f = new Future();
		webOS.Posix.unlink(path, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("unlink("+path+"): "+response.message);
			}
		}));
		return f;
	},
	rename: function(originalName, newName) {
		var f = new Future();
		webOS.Posix.rename(originalName, newName, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("rename("+originalName+", "+newName+"): "+response.message);
			}
		}));
		return f;
	},
	system: function(cmd) {
		var f = new Future();
		webOS.Posix.system(cmd, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("system("+cmd+"): "+response.message);
			}
		}));
		return f;
	},
	popen: function(cmd) {
		var f = new Future();
		webOS.Posix.popen(cmd, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error(response.message);
			}
		}));
		return f;
	}
};
exports.Posix = Posix;


var ChainLink = Class.create({
	initialize: function initialize(tail, onSuccess, onFailure) {
		//next output to be passed on will have this id.
		this.nextOutputId = this.nextInputId = 1;

		//'tail's don't save and queue output
		if(tail) {
			this._queueOutput = this._sendQueuedOutput = function() {};
		} else {
			this.pendingOutput = {};
		}
		
		this.chainLinkInit = true;
		this.onSuccess = onSuccess;
		this.onFailure = onFailure;
		
	},
	
	setNext: function setNext(link) {
		if(!this.chainLinkInit) {
			throw new Error('Please initialize the ChainLink with "this.$super(initialize)();"');
		} else if(this.nextLink) {
			throw new Error('Next link already set.');
		} else {
			this.nextLink = link;
			link.prevLink = this;
			this._sendQueuedOutput();
		}
	},
	
	_queueInput: function(input) {
		var pendingInput = this.pendingInput || [];
		this.pendingInput = pendingInput.concat(input);
		this.pendingInput.done = input.done;
	},
	
	_sendQueuedInput: function() {
		var id = this.nextInputId;
		var that = this;
		var input = this.pendingInput;
		
		var onSuccess;
		
		if(!this.paused && input && input.length) {
			this.nextInputId++;
			this.pendingInput = undefined;

			this.handleInput(input, function(output) {
				//output must be an object. otherwise, it's assumed that the link has nothing to pass on for 
				//this particular input.
				that._queueOutput(id, output || null);
				if(!that.paused) {
					that._sendQueuedOutput();
				}
			});

			if(input.done) {
				onSuccess = this.onSuccess;
				if(onSuccess) {
					onSuccess();
					//XXX: not necessarily correct, onFailure may be needed later.
					this.onSuccess = this.onFailure = undefined;
				}
			}
		}
	},
	
	_queueOutput: function(id, output) {
		this.pendingOutput[id] = output;
	},
	
	_sendQueuedOutput: function() {
		var i;
		var pendingOutput = this.pendingOutput;
		var next, nextOutput;
		var toSend;
		var done;
		
		next = this.nextOutputId;
		
		//links are allowed to pass a falsy-non object, which is converted to nulls if they don't want to return anything on particular bufferList.
		if(pendingOutput[next] || (pendingOutput[next] === null)) {
			toSend = [];
			while((nextOutput = pendingOutput[next]) || (nextOutput === null)) {
				if(nextOutput) {
					toSend.push(nextOutput);
				}
				done = nextOutput.done;
				delete pendingOutput[next];
				next++;
			}
			this.nextOutputId = next;

			toSend = Array.prototype.concat.apply([], toSend);
			toSend.done = done;
			this.nextLink.preprocessInput(toSend);
		}
	},
	
	preprocessInput: function preprocessInput(input) {
		this._queueInput(input);
		this._sendQueuedInput();
	},

	//this likely should be replaced by subclass.
	handleInput: function handleInput(input, outputCB) {
		var output = input;
		outputCB(output);
	},

	//XXX: set up exception call chain.
	//by default, pause and cleanup if propagating backwards / forwards.
	handleException: function handleException(e) {
		var onFailure = this.onFailure;
		if(onFailure) {
			onFailure(e);
			//XXX: not necessarily correct, onSuccess may be needed later if onFailure is not associated.
			this.onSuccess = this.onFailure = undefined;
		}
	},
	
	pause: function pause() {
		if(!this.paused) {
			this.paused = true;
		}
	},
	
	resume: function resume() {
		if(this.paused) {
			this.paused = false;
			this._sendQueuedInput();
		}
	},
});



var BufferList = exports.BufferList = Class.create(ChainLink, {
	DEFAULT_BUFFER_SIZE: 16384,
	MIN_SPACE: 16,
	
	initialize: function initialize(ioInput) {
		var last = this.last = this.createBuffer();
		this.ioInput = ioInput;

		this.bufferList = [last];
		this.targets = [];
		
		this.paused = true;
		this.$super(initialize)();
	},
	
	createBuffer: function() {
		//Buffer creation failure??
		return Buffer.create(this.DEFAULT_BUFFER_SIZE);
	},
	
	getUnfullBuffer: function() {
		var last = this.last;
		
		if(last.space > this.MIN_SPACE) {
			return last;
		} else {
			this.preprocessInput(last);
			last = this.createBuffer();
			this.bufferList.push(last);
			return last;
		}
	},

	_setOnRead: function() {
		var that = this;
		this.ioInput.onread = function() {
			that._onRead(that);
		};
	},
	
	pause: function pause() {
		if(!this.paused) {
			this.paused = true;
			this.ioInput.onread = undefined;
		}
	},
	
	resume: function resume() {
		if(this.paused) {
			this.paused = false;
			this._setOnRead();
			this._sendQueuedInput();
		}
	},
	
	
	_onRead: function(that) {
		if(that.done) {
			throw new Error("Attempted to write to a completed BufferList.");
		}
		
		var buffer = that.getUnfullBuffer();
		var input = that.ioInput; 
		var ret;

		ret = input.readUsingBuffer(buffer, buffer.space);

		if(ret === 0 ) {
			//can rely on 0 read due to min space req.
			that.done = buffer.done = true;
			that.preprocessInput(buffer);
		}
	}
});


var ChainInput = exports.ChainInput = {};

var InputSource = Class.create({
	//subclasses are expected to set this.bufferList.
	
	setNext: function(target) {
		this.bufferList.setNext(target);
	},
	
	pause: function() {
		this.bufferList.pause();
	},
	
	resume: function() {
		this.bufferList.resume();
	}
});

var CurlInput = ChainInput.CurlInput = Class.create(InputSource, {
	initialize: function(url, postData) {
		// var fetchData;
		// var curl = new webOS.Curl(url);
		// this.bufferList = new BufferList(curl);
		// 
		// if(postData) {
		// 	this.fetchData = function() {
		// 		curl.post(postData, this.onSuccess, this.onFailure)
		// 	}
		// } else {
		// 	//default to 'get'
		// 	this.fetchData = function() {
		// 		curl.get(this.onSuccess, this.onFailure)
		// 	}
		// }
	},
	
	
	
});

var SocketInput = ChainInput.SocketInput = Class.create(InputSource, {
	//XXX: in ioInput.
	// fin.flags |= webOS.IOChannel.FLAG_NONBLOCK;
	// initialize: function(address, ) {
	// 	
	// }
});

var FileInput  = ChainInput.FileInput = Class.create(InputSource, {
	initialize: function(path) {
		var fetchData;
		var file = new webOS.IOChannel.Channel(path, 'r');
		file.flags |= webOS.IOChannel.FLAG_NONBLOCK;
		this.bufferList = new BufferList(file);
	},
	
});

var BufferListInput =  ChainInput.BufferListInput = Class.create(ChainLink, {
	queueBuffers: function(buffers) {
		this.preprocessInput(buffers);
	},
});

var StringListInput = ChainInput.StringListInput = Class.create(ChainLink, {
	queueStrings: function(strings) {
		var i;
		var buffers = [];
		var buffer;
		var len = strings.length;

		//change this to single buffer?
		for(i = 0; i < len; i++) {
			buffer = Buffer.create();
			buffer.writeString(strings[i]);
			buffers[i] = buffer;
		}
		buffers.done = strings.done;
		console.log("queue strings...");
		this.preprocessInput(buffers);
	},
});



	/*
	calls:
	this.nextLink.preprocessInput(Array.prototype.concat.apply([], toSend));
	
	*/


var ChainOutput = exports.ChainOutput = {};

var FileOutput = ChainOutput.FileOutput = Class.create(ChainLink, {
	initialize: function initialize(path, mode, tail, onSuccess, onFailure) {
		this.ioChannel = new webOS.IOChannel.Channel(path, mode);
		this.ioChannel.flags |= webOS.IOChannel.FLAG_NONBLOCK;
		this.$super(initialize)(tail, onSuccess, onFailure);
	},
	
	
	_onWrite: function(ioChannel, bufferList) {
		var i, buffer;

		for(i = bufferList.length - 1; i >= 0; i--) {
			buffer = bufferList[i];
			buffer.position = 0;
			ioChannel.writeUsingBuffer(buffer, buffer.length);
			ioChannel.flush();
		}
	},
	
	
	handleInput: function(bufferList, outputCB) {
		var that = this;
		this.prevLink.pause();
			that._onWrite(that.ioChannel, bufferList);
			that.prevLink.resume();
			outputCB(bufferList);
	},
	
});


var StringOutput = ChainOutput.StringOutput = Class.create(ChainLink, {
	initialize: function(tail, onSuccess, onFailure) {
		this.stringArray = [];

		this.$super(initialize)(tail, onSuccess, onFailure);
		
	},
	
	handleInput: function(bufferList, outputCB) {
		var ioChannel;
		var output;
		
		
		
		outputCB(bufferList);
	},
});


