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

include("test/loadall.js");

var MockInputSource = Class.create(InputSource, {
	// fetchData: function() {
	// 	this.onread();
	// }
});

var TestOutput = Class.create(ChainLink, {
	initialize: function(expected, resultCB) {
		this.expected = expected;
		this.passed = MojoTest.passed;
		this.resultCB = resultCB;
	},
	
	handleInput: function(bufferList) {
		var i, buffer, result;
		var expected = this.expected;
		
		for(i=0; i < bufferList.length; i++) {
			buffer = bufferList[i];
			buffer.position = 0;
			result = buffer.readString();
			if(expected && (result !== expected[i])) {
				this.passed = "Didn't pass on " + i + ' ' + result;
			}
			console.log('printing ', i, ' -> ', result);
		}
		
		if(this.resultCB) {
			this.resultCB(this.passed);
		}
	}
	
	
});

var MockChainSource = Class.create({
	initialize: function(data) {
		this.data = data;
		this.idx = 0;

	},
	
	setNext: function(next) {
		this.next = next;
	},
	
	sendData: function() {
		this.next.preprocessInput(this.data[this.idx]);
		this.idx++;
	}
});

var MockChainLink = Class.create(ChainLink, {
	initialize: function initialize(customHandler) {
		this.customHandler = customHandler;
		this.$super(initialize)();
	},
	
	handleInput: function(input, cb) {
		var that = this;
		var customHandler = this.customHandler;
		setTimeout(function() {
			customHandler(this, input, cb);
		}, 1);
	},
});

var MockChainTail = Class.create({
	initialize: function(expected, cb, isEqual) {
		this.expected = expected;
		this.resultCB = cb;
		this.isEqual = isEqual || this.isEqual;
		this.results = [];
	},
	
	isEqual: function(a, b) {
		var i;
		var res = true;
		for(i = 0; i < a.length; i++) {
			try{
				res = res && (a[i] === b[i]);
				
			} catch(e) {
				console.log("error!");
				res = false;
			}
		}
		return res;
	},
	
	preprocessInput: function(input) {
		this.results.push(input);
	},
	
	checkResult: function() {
		var i;
		var expected = this.expected;
		var actual = this.results;

		for(i=0; i< expected.length; i++) {
			if(!this.isEqual(expected[i], actual[i])) {
				this.resultCB("bad result, expected '" + JSON.stringify(expected) + "' actual : '" + JSON.stringify(actual) +"'" );
			}
		}
		this.resultCB(MojoTest.passed);
	}
});

var ChainTests = Class.create(
{
	// testCreateBufferList: function()
	// {
	// 	var mock = new MockInputSource();
	// 	var bl = new BufferList(mock);
	// 	
	// 	//mock.fetchData();
	// 	//return MojoTest.passed;
	// },
	// 
	// 
	delay: function(context, func, time, args) {
		setTimeout(function() {
			func.apply(context, args);
		}, time || 1);
	},
	
	testFileInput: function(resultCB) {
		var input = new FileInput('test/read/testbytes');
		var output = new TestOutput(['helloworld'], resultCB);
		
		input.setNext(output);
		input.resume();
	},
	
	testFileOutput: function(resultCB) {
		var path = 'test/write/testchain';
		var data = 'This is a testFileOutput test.'
		var wrappedData = [data];
		wrappedData.done = true;
		
		var resultChecker = function() {
			var checker = new FileInput(path);
			var output = new TestOutput(wrappedData, resultCB);
			checker.setNext(output);
			checker.resume();
		}
		
		var input = new StringListInput(false, resultChecker);
		var output = new FileOutput(path, 'w', true);

		input.setNext(output);
		input.resume();

		input.queueStrings(wrappedData);

	},
	
	testChainLink: function(resultCB) {
		var data = [['input1'], ['input2'], ['input3']];
		var head = new MockChainSource(data);
		var tail = new MockChainTail(data, resultCB);
		var middle = new MockChainLink(function(link, input, cb){
			cb(input);
		});
		
		head.setNext(middle);
		middle.setNext(tail);
		
		this.delay(head, head.sendData, 10);
		this.delay(head, head.sendData, 20);
		this.delay(head, head.sendData, 30);		
		this.delay(tail, tail.checkResult, 40);
		
	},
	

});

ChainTests.timeoutInterval = 10000;