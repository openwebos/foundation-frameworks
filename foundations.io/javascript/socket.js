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