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

//include("mojoloader.js");
var libraries = MojoLoader.require(
	{ name: "foundations", version: "1.0" },
	{ name: "underscore", version: "1.0" }
);
var Future = libraries["foundations"].Control.Future;
var mapReduce = libraries["foundations"].Control.mapReduce;
var _ = libraries["underscore"]._;

function MapReduceTests() {};

MapReduceTests.prototype.testMapAllSuccessDefaultReduce = function(done) {
	var durations = [300, 200, 100];
	var start = Date.now();
	
	var future = mapReduce({
		map: map
	}, durations);
	
	future.then(function() {
		var result = future.result;
		var end = Date.now();
		MojoTest.requireEqual(durations.sort().join(), _.pluck(result, "result"));
		
		// map reduce should really be faster than executing serially (although not guaranteed)
		MojoTest.require((end-start) < 600);
		
		done(MojoTest.passed);
	});
	
	function map(v) {
		var f = new Future();
		setTimeout(function() {
			f.result = v;
		}, v);
		
		return f;
	};
};

MapReduceTests.prototype.testMapPartialFailure = function(done) {
	var data = [
		{name: "duck", say: "quack", after: 300},
		{name: "duck", say: "quack", after: 100},
		{name: "goose", after: 200}
	];
	var future = mapReduce({ map: map, reduce: reduce }, data);
	future.then(function() {
		var result = future.result;
		
		MojoTest.requireEqual(3, result.length);
		MojoTest.requireEqual(3, _.compact(_.pluck(result, "item")).length);
		MojoTest.requireEqual(2, _.compact(_.pluck(result, "result")).length);
		MojoTest.requireEqual(1, _.compact(_.pluck(result, "exception")).length);
		done(MojoTest.passed);
	});
	
	function map(animal) {
		var f = new Future();
		setTimeout(function() {
			try {
				f.result = [animal.name, " has this much to say: ", animal.say.length].join();
			} catch (e) {
				f.exception = e;
			}
		}, animal.after);
		return f;
	};
	
	function reduce(results) {
		// do not throw errors, just pass them through
		return new Future().immediate(results);
	};
};

MapReduceTests.prototype.testMapTotalFailureSuppressed = function(done) {
	var data = [300, 200, 100];
	var future = mapReduce({ map: map, reduce: reduce }, data);
	future.then(function() {
		var result = future.result;
		
		MojoTest.requireEqual(3, result.length);
		MojoTest.requireEqual(3, _.compact(_.pluck(result, "item")).length);
		MojoTest.requireEqual(0, _.compact(_.pluck(result, "result")).length);
		MojoTest.requireEqual(3, _.compact(_.pluck(result, "exception")).length);
		done(MojoTest.passed);
	});
	
	function map(ms) {
		var f = new Future();
		setTimeout(function() {
			f.exception = new Error("pretend something went wrong at t=" + ms);
		}, ms);
		return f;
	};
	
	function reduce(results) {
		return new Future().immediate(results);
	};
};

MapReduceTests.prototype.testMapTotalFailureDefault = function(done) {
	var data = [300, 200, 100];
	var future = mapReduce({ map: map }, data);
	future.then(function() {
		try {
			var result = future.result;
			done("exception was not thrown");
		} catch (e) {
			// in failure cases, the default reduce SHOULD throw exceptions from map
			done(MojoTest.passed);
		}
	});
	
	function map(ms) {
		var f = new Future();
		setTimeout(function() {
			f.exception = new Error("pretend something went wrong at t=" + ms);
		}, ms);
		return f;
	};
};
