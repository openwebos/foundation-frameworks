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

// Augment webOS.Buffer

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
