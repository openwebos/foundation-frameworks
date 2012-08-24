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
