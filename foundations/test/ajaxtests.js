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

/*global setTimeout, MojoTest, Foundations */
var AjaxCall = Foundations.Comms.AjaxCall;
function AjaxTests() {
}

AjaxTests.prototype.testGoogle1 = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.get("http://www.google.com");
	future1.then(function() {
		result += 1;
	});

	future1.then(function() {
		result += 100;
	});
	
	setTimeout(function()
	{
		reportResults(result == 1 ? MojoTest.passed : "Bad result: " + result);
	}, 2000);
};

AjaxTests.prototype.testGoogleStatus = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.get("http://www.google.com");
	future1.then(function(future) {
		if (future.result.status == 200) {
			reportResults(MojoTest.passed);
		} else {
			reportResults("Failed, status value =="+future.result.status);
		}
	});
};

AjaxTests.prototype.testGoogleResponse = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.get("http://www.google.com");
	future1.then(function(future) {
		MojoTest.requireEqual(future.result.status, 200);
		MojoTest.requireMatch(future.result.responseText, "google.com");
		future.result=MojoTest.passed;
	});
	future1.then(function(future) {
		reportResults(future);
	});
};

AjaxTests.prototype.testGoogleHeader = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.head("http://www.google.com");
	future1.then(function(future) {
		MojoTest.requireEqual(future.result.status, 200);
		MojoTest.requireMatch(future.result.responseText, "google.com");
		//console.log(future.result.responseText);
		MojoTest.requireMatch(future.result.responseText, "Content-Type:");		
		future.result=MojoTest.passed;
	});
	future1.then(function(future) {
		reportResults(future);
	});
};

AjaxTests.prototype.testGoogle2 = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.call("get", "http://www.google.com");
	future1.then(function() {
		result += 1;
	});

	future1.then(function() {
		result += 100;
	});
	
	setTimeout(function()
	{
		reportResults(result == 1 ? MojoTest.passed : "Bad result: " + result);
	}, 2000);
};

AjaxTests.prototype.testGoogle3 = function(reportResults) {
	var result = 0;
	var future1 = AjaxCall.call(AjaxCall.RequestMethod.GET, "http://www.google.com");
	future1.then(function() {
		result += 1;
	});

	future1.then(function() {
		result += 100;
	});
	
	setTimeout(function()
	{
		reportResults(result == 1 ? MojoTest.passed : "Bad result: " + result);
	}, 2000);
};

AjaxTests.prototype.testCancel = function(reportResults) {
	var read = 0;
	var future1;
	function dataReady(bytes) {
		//console.log("read "+bytes+" bytes");
		read += bytes;
		AjaxCall.cancel(future1);
	}
	future1 = AjaxCall.call(AjaxCall.RequestMethod.GET, "http://www.yahoo.com", undefined, {onRead: dataReady});
	future1.onError(function(future) {
		//console.log("onError called");
		if (future.exception.toString().match("Error: Operation was aborted by an application callback")) {
			reportResults(MojoTest.passed);
		} else {
			reportResults(future.exception);
		}
	});
	future1.then(function(future) {
		reportResults("Shouldn't this have failed? result was: "+JSON.stringify(future.result).substring(0, 100));
	});
};

AjaxTests.prototype.testHeader = function(reportResults) {
	var result = MojoTest.failed;
	var future1;
	function headerReady(key, value) {
		//console.log("key: "+ key + ", value: "+value);
		if (key.match("Content-Type") && value.match("text/html")) {
			result = MojoTest.passed;
		}
	}
	future1 = AjaxCall.call(AjaxCall.RequestMethod.HEAD, "http://www.yahoo.com", undefined, {onHeader: headerReady});
	future1.onError(function(future) {
		reportResults(future.exception);
	});
	future1.then(function(future) {
		reportResults(result);
	});
};

AjaxTests.prototype.testGetResponseHeader = function(reportResults) {
	var future1;
	future1 = AjaxCall.call(AjaxCall.RequestMethod.HEAD, "http://www.yahoo.com", undefined, {});
	future1.onError(function(future) {
		//console.log("onError called");
		reportResults(future.exception);
	});
	future1.then(function(future) {
		var result = future.result;
		if (result.getResponseHeader("Content-Type").match("text/html")) {
			reportResults(MojoTest.passed);
		} else {
			reportResults("Not text/html?");
		}
	});
};

AjaxTests.prototype.testGetAllResponseHeaders = function(reportResults) {
	var future1;
	future1 = AjaxCall.call(AjaxCall.RequestMethod.HEAD, "http://www.yahoo.com", undefined, {});
	future1.onError(function(future) {
		//console.log("onError called");
		reportResults(future.exception);
	});
	future1.then(function(future) {
		var result = future.result;
		var headers = result.getAllResponseHeaders();
		//console.log(headers);
		if (headers.match("text/html")) {
			reportResults(MojoTest.passed);
		} else {
			reportResults("Not text/html? "+ headers);
		}
	});
};

AjaxTests.timeoutInterval = 4000;
