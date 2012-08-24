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

// A special test runner to use when testing foundations trunk

include("mojoloader.js");

//MojoLoader.override({ name: "foundations", trunk: true });
var libraries = MojoLoader.require({ name: "unittest", version: "1.0" }, { name: "foundations", version: "1.0"});
var MojoTest = libraries.unittest.UnitTest;
var resultsAsJSON = false;
var quietMode = false;
var totalTests=0;
var failedTests=0;
var enableProfile=false;

var testCollection;
var messageLength=40;
var tracer;

function fitString(targetString, targetLength, padWith) {
	MojoTest.trace("fitString(targetString='"+targetString+"', targetLength="+targetLength+", padWith="+padWith);
	padWith = padWith || " ";
	targetString = "" + targetString;
	while (targetString.length >= targetLength) {
		targetLength += 4;
	}
	messageLength = targetLength;
	var amountToAdd = targetLength - targetString.length;
	while (amountToAdd > 0) {
		targetString = targetString + padWith;
		amountToAdd --;
	}
	return targetString;
}

function testDone(runner) {
	MojoTest.trace("testDone()");
	if (resultsAsJSON) {
		var r = runner.results;
		console.log(MojoTest.resultsToJSON(r));
	}
	else
	{
		if (failedTests > 0) {
			console.log(MojoTest.templateReplace("FAILED #{failed} of #{total} tests", {failed: failedTests, total:totalTests}));
		} else {
			console.log("Done. All ("+totalTests+"/"+totalTests+") tests passed");
		}
	}
	if (enableProfile) {
		console.log("MojoTest functions not called:");
		var names=tracer.nameMap;
		for (var name in names) {
			if (names.hasOwnProperty(name)) {
				var count = tracer.getCountFor(name);
				if (count === 0) {
					console.log(name);
				}
			}
		}
		//tracer.dumpStats();
	}
	quit();
}

function progress(collectionRunner, test)
{
	MojoTest.trace("progress(runner, test)");
	//console.log("progress.");
	if (!resultsAsJSON) {
		MojoTest.each(test.results, function(r) {
			totalTests++;
			if (!r.passed) {
				failedTests++;
			}
			if (!quietMode || !r.passed) {
				if (r.elapsed_time!==undefined) {
					console.log(fitString(r.suite + "#" + r.method + ":", messageLength) + r.message+"    ("+r.elapsed_time+" msec.)");		
				}
				else {
					console.log(fitString(r.suite + "#" + r.method + ":", messageLength) + r.message);		
				}
			}
		});		
	}
}

function collect(array, func) {
	MojoTest.trace("collect()");
	var i;
	var results=[];
	for (i=0; i< array.length; i++) {
		var v = array[i];
		results.push(func(v));
	}
	return results;
}

function compact(array) {
	MojoTest.trace("compact()");
	var result=[];
	var i;
	for (i=0; i < array.length; i++) {
		var v = array[i];
		if (v !== undefined && v !== null) {
			result.push(v);
		}
	}
	return result;
}

function runTestCollection(suiteName)
{
	MojoTest.trace("runTestCollection()");
	//console.log("running collection");
	try {
		var tests;
		//console.log("testCollection=" + testCollection);
		tests = collect(testCollection, function(testSpec) {
			if (suiteName !== undefined && testSpec.testFunction !== suiteName) {
				console.log("name mismatch");
				return undefined;
			}
			//console.log("MojoTest.findConstructorFunction(" + testSpec.testFunction +")");
			var constructor = MojoTest.findConstructorFunction(testSpec.testFunction);
			if (typeof(constructor) == "undefined") {
				console.log("test_runner.js: couldn't find constructor for " + testSpec.testFunction);
			}
			return constructor;
		});
		tests = compact(tests);
		//console.log("tests=" + tests);
		this.runner = new MojoTest.CollectionRunner(tests, {progress: progress});
		var that=this;
		this.runner.start(function() { testDone(that.runner); });
	} catch (e) {
		//console.log("caught exception");
		var logMsg = "test runner failure: " + e.name + ': ';

		if (e.message) {
			logMsg = logMsg + e.message + " ";
		}

		if (e.sourceURL) {
			logMsg = logMsg + ', ' + e.sourceURL;
		}
		if (e.line) {
			logMsg = logMsg + ':' + e.line;
		}
		if (e.stack) {
			logMsg = logMsg + ':' + e.stack;
		}
		console.log(logMsg);
		quit();
	}
}

function contains(array, val) {
	MojoTest.trace("contains(["+array+"], "+val+")");
	var i;
	for (i=0; i < array.length; i++) {
		if (array[i] == val) {
			return true;
		}
	}
	return false;
}

function isOptions (arg) {
	MojoTest.trace("isOptions("+arg+")");
	return arg[0] === '-';
}

function usage() {
	MojoTest.trace("usage()");
	console.log("Usage is test_runner -- [options] [path to test specification file] [optional suite name]\nOptions:");
	console.log("-h [--help]\t\tPrint this message");
	console.log("-j [--json]\t\tOutput in JSON format");
	console.log("-t [--trace]\t\tEnable (extremely verbose) tracing in MojoTest");
	console.log("-q [--quiet]\t\tNo output for tests that pass");
	quit();
}

function main(argv) {
	var options = MojoTest.select(argv, isOptions);
	var args = MojoTest.reject(argv, isOptions);
	//console.log("arguments="+typeof(argv));
	//console.log("options="+options);
	//console.log("args="+args);
	if (args.length < 1 || contains(options, "-h") || contains(options, "--help")) {
		usage();
	}
	else {
		MojoTest.enableTrace(contains(options, "-t") || contains(options, "--trace"));
		MojoTest.trace("test_runner.js");
		quietMode = contains(options, "-q") || contains(options, "--quiet");
		resultsAsJSON = contains(options, "-j") || contains(options, "--json");
		enableProfile = contains(options, "-p") || contains(options, "--profile");
		if (enableProfile) {
			tracer = new MojoTest.Tracer();
			tracer.wrap(MojoTest, "MojoTest");
		}
		testCollection = MojoTest.loadCollection(args[0], function runt() { runTestCollection(args[1]); });
		startApplicationLoop();
	}
}

