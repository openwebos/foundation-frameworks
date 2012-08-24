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
