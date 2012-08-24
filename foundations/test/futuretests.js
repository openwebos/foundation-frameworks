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

/*global include, Future, UnitTest */

function curry(f)
{
	var old = Array.prototype.slice.call(arguments, 1);
	return function()
	{
		f.apply(undefined, old.concat(Array.prototype.slice.call(arguments, 0)));
	};
}

function bind(f, scope)
{
	var old = Array.prototype.slice.call(arguments, 2);
	return function()
	{
		f.apply(scope, old.concat(Array.prototype.slice.call(arguments, 0)));
	};
}

function FutureTests() {
}

FutureTests.prototype.testSimpleNow = function(reportResults) {
	this.future = new Future();
	this.future.now(curry(this._nowTest, reportResults));
};

FutureTests.prototype._nowTest = function(reportResults, future) {
	reportResults(UnitTest.passed);
};

FutureTests.prototype.testSimpleNowAndThen = function(reportResults) {
	this.future = new Future();
	this.future.now(this,this._doThis);
	this.future.then(this, curry(this._doThat, reportResults));
};

FutureTests.prototype._doThis = function(future) {
	future.result = UnitTest.passed;
};

FutureTests.prototype._doThat = function(reportResults, future) {
	reportResults(future.result);
};

FutureTests.prototype.testThenChains = function(reportResults) {
	var f = new Future();
	f.now(this, this._stepOne);
	f.then(this, this._stepTwo);
	f.then(this, this._stepThree);
	f.then(function(future) { 
		if (future.result === "three") { 
			reportResults(UnitTest.passed); 
		} else { 
			reportResults(future.exception); 
		} 
	});
};

FutureTests.prototype._stepOne = function(future) {
	//Mojo.Log.info("one");
	future.result = "one";
};

FutureTests.prototype._stepTwo = function(future) {
	//Mojo.Log.info("two");
	UnitTest.require(future.result === "one");
	future.result = "two";
};

FutureTests.prototype._stepThree = function(future) {
	//Mojo.Log.info("three");
	UnitTest.require(future.result === "two");
	future.result = "three";
};

FutureTests.prototype.testSimpleCallback = function(reportResults) {
	//Mojo.Log.info("Starting testSimpleCallback...this=" + this);
	var f = new Future();
	f.now(this, bind(this._asyncCall, this));
	f.then(this, function(future) {
		//Mojo.Log.info("Reporting result");
		reportResults(future.result);
	});
};

FutureTests.prototype._asyncCall = function(future) {
	//Mojo.Log.info("Starting async call...this=", this, ", this._callback = ", this._callback, ", future = ", future );
	setTimeout(future.callback(this, curry(this._callback, future)), 100);
};

FutureTests.prototype._callback = function(future) {
	//Mojo.Log.info("timeout fired...this=" + this + ", future=" + future);
	future.result = UnitTest.passed;
};

FutureTests.prototype.testCancel = function(reportResults) {
	//Mojo.Log.info("testCancel started");
	var f = new Future();
	f.then(
		this, function(future) {
			//console.log("in then1, future="+JSON.stringify(future));
			// reportResult after 100ms
			setTimeout(function() {
				reportResults(UnitTest.passed);
			}, 100);
			future.cancel();
			future.result="DONE";
		}
	).then(
		this, function(future) {
			//console.log("in then2, future="+JSON.stringify(future));
			reportResults("Should never get here");
		}
	);
	f.result=UnitTest.passed;
};

FutureTests.prototype.testCancel2 = function(reportResults) {
	//Mojo.Log.info("testCancel2 started");
	var f = new Future(UnitTest.passed);
	f.then(
		this, function(future) {
			//console.log("in then1, future="+JSON.stringify(future));
			// reportResult after 100ms
			setTimeout(function() {
				reportResults(UnitTest.passed);
			}, 100);
			future.cancel();
			future.result="DONE";
		}
	).then(
		this, function(future) {
			//console.log("in then2, future="+JSON.stringify(future));
			reportResults("Should never get here");
		}
	);
};

FutureTests.prototype._beforeCancel = function(future) {
	//Mojo.Log.info("_beforeCancel, this=", this, " future=", future);
};

FutureTests.prototype.testWhilst1 = function(reportResults) {
	return new Future()
		.now(
			function(f)
			{
				f.result = 0;
			}
		)
		.whilst(this,
			function(f)
			{
				return f.result < 10;
			},
			function(f)
			{
				f.result++;
			}
		)
		.then(
			function(f)
			{
				if (f.result == 10) {
					f.result = UnitTest.passed;
				} else {
					f.result = "Error, should have been 10, was "+f.result;
				}
			}
		)
	;
};

FutureTests.prototype.testWhilst2 = function(reportResults) {
	return new Future()
		.now(
			function(f)
			{
				f.result = 0;
			}
		)
		.whilst(
			function(f)
			{
				return f.result < 10;
			},
			function(f)
			{
				f.result++;
			}
		)
		.then(
			function(f)
			{
				if (f.result == 10) {
					f.result = UnitTest.passed;
				} else {
					f.result = "Error, should have been 10, was "+f.result;
				}
			}
		)
	;
};

FutureTests.prototype.testReturnTypes = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		// return a value - assigns that value to future.result
		//console.log("step 1");
		UnitTest.requireEqual(future.result, 1);
		return 2;
	});
	f.then(function(future) {
		// return undefined - waits for async setting of result
		//console.log("step 2");
		UnitTest.requireEqual(future.result, 2);
		setTimeout(function() {
			future.result = 3;
		}, 100);
	});
	f.then(function(future) {
		// return a future - nests on the other future
		//console.log("step 3");
		UnitTest.requireEqual(future.result, 3);
		return new Future().now(function(future) {
			setTimeout(function() {
				future.result = 4;
			}, 100);
		});
	});
	f.then(function(future) {
		// finally...
		//console.log("step 4");
		UnitTest.requireEqual(future.result, 4);
		reportResults(UnitTest.passed);
	});
};

FutureTests.prototype.testResultGetters = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		UnitTest.requireEqual(1, future.result);
		future.result = 2;
	});
	f.then(function(future) {
		UnitTest.requireEqual(2, future.getResult());
		future.result = 3;
	});
	f.then(function(future) {
		UnitTest.requireEqual(future.result, future.getResult());
		reportResults(UnitTest.passed);
	});
	
};

FutureTests.prototype.testResultSetters = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		UnitTest.requireEqual(1, future.result);
		future.result = 2;
	});
	f.then(function(future) {
		UnitTest.requireEqual(2, future.getResult());
		future.setResult(3);
	});
	f.then(function(future) {
		UnitTest.requireEqual(future.result, future.getResult());
		future.setResult(UnitTest.passed);
	});
	return f;
};

FutureTests.prototype.testExceptionGetters = function(reportResults) {
	var f = new Future(1);
	f._logexception = UnitTest.doNothing;
	f.then(function(future) {
		throw 2;
	});
	f.then(function(future) {
		var e = future.exception;
		UnitTest.requireEqual(e, 2);
		throw 3;
	});
	f.then(function(future) {
		var e = future.exception;
		UnitTest.requireEqual(e, 3);
		future.result = UnitTest.passed;
	});
	return f;
};

FutureTests.prototype.testExceptionSetters = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		future.exception = 2;
	});
	f.then(function(future) {
		var e = future.exception;
		UnitTest.requireEqual(e, 2);
		future.setException(3);
	});
	f.then(function(future) {
		var e = future.exception;
		UnitTest.requireEqual(e, 3);
		future.result = UnitTest.passed;
	});
	return f;
};

FutureTests.prototype.testReturnNull = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		return null;
	});
	f.then(function(future) {
		if (future.result ===null) {
			f.result = UnitTest.passed;
		} else {
			f.result = "should be null";
		}
	});
	return f;
};

FutureTests.prototype.testReturnEmptyObject = function(reportResults) {
	var f = new Future(1);
	f.then(function(future) {
		return {};
	});
	f.then(function(future) {
		f.result = UnitTest.passed;
	});
	return f;
};

FutureTests.prototype.testNestEmptyObject = function(reportResults) {
	var f = new Future(1);
	f._logexception = UnitTest.doNothing;
	f.then(function(future) {
		future.nest({});
	});
	f.then(function(future) {
		f.result = "Should have thrown";
	},
	function(future) {
		var expected = "Future.nest() expects to be passed a Future";
		if(f.exception.message === expected) {
			f.result = UnitTest.passed;
		} else {
			f.result = 'Message was "'+f.exception.message+'", was expecting: "'+expected+'"';
		}
	});
	return f;
};

FutureTests.prototype.testNestNull = function(reportResults) {
	var f = new Future(1);
	f._logexception = UnitTest.doNothing;
	f.then(function(future) {
		future.nest(null);
	});
	f.then(function(future) {
		f.result = "Should have thrown";
	},
	function(future) {
		var expected = "Future.nest() expects to be passed a Future, was of type object";
		if(f.exception.message === expected) {
			f.result = UnitTest.passed;
		} else {
			f.result = 'Message was "'+f.exception.message+'", was expecting: "'+expected+'"';
		}
	});
	return f;
};

/* MapReduce passes along whatever is in the data array as the scope (including possibly null), so this test seems invalid...
FutureTests.prototype.testThenNullContext = function(reportResults) {
	var f = new Future(1);
	var expected = "Future.now() or Future.then(): scope should be an object";
	try {
		f.then(null, function(future) {
			future.result=2;
		});
	} catch(e) {
		if(e.message === expected) {
			reportResults(UnitTest.passed);
		} else {
			reportResults('Message was "'+f.exception.message+'", was expecting: "'+expected+'"');
		}
		return;
	}
	return "Didn't raise an exception";
};
*/
FutureTests.prototype.testCallbackPlain = function(reportResults) {
	var f = new Future();
	setTimeout(f.callback(function() {
		console.log("in callback");
		f.result = UnitTest.passed;
	}), 100);
	f.then(function(future) {
		console.log("in then");
		reportResults(future.result);
	});
};

FutureTests.prototype.testCallbackReturn = function(reportResults) {
	var f = new Future();
	setTimeout(f.callback(function() {
		console.log("in callback");
		return UnitTest.passed;
	}), 100);
	f.then(function(future) {
		console.log("in then");
		reportResults(future.result);
	});
};
