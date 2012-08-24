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

