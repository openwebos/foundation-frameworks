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
//		XXX: look into why setting 'onwrite' doesn't always work.
//		this.ioChannel.onwrite = function() {
//			that.ioChannel.onwrite = undefined;
			that._onWrite(that.ioChannel, bufferList);
			that.prevLink.resume();
			outputCB(bufferList);
//		};
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
