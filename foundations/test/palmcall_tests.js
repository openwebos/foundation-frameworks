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

/*global Test, Foundations, Future */
function PalmCallTests() {
}

PalmCallTests.prototype = {
	testNoReturnValue: function(result) {
		var uri = 'palm://com.palm.lunabus/signal';
		var cmd = 'registerServerStatus';
		var args = {"serviceName":"com.palm.systemservice"};
		Foundations.Comms.PalmCall.call(uri, cmd, args).then(function(future) {
			var response = future.result;
			//console.log("response="+JSON.stringify(response));
			if (response.connected && response.serviceName) {
				future.result=Test.passed;
			} else {
				future.result=Test.failed;
			}
		}).then(function(future) {
			result(future);
		});
	},
	testTrueReturnValue: function(result) {
		var uri = 'palm://com.palm.db';
		var cmd = 'get';
		var args = {ids:[]};
		Foundations.Comms.PalmCall.call(uri, cmd, args).then(function(future) {
			var response = future.result;
			//console.log("response="+JSON.stringify(response));
			if (response.returnValue===true && response.results) {
				future.result=Test.passed;
			} else {
				future.result="unexpected response "+ JSON.stringify(response);
			}
		}).then(function(future) {
			result(future);
		});
	},
	testFalseReturnValue: function(result) {
		var uri = 'palm://com.palm.db';
		var cmd = 'get';
		var args = {};
		Foundations.Comms.PalmCall.call(uri, cmd, args).then(function(future) {
			if (!future.exception) {
				future.result="No exception raised";
			} else {
				var response = future.exception.response;
				//console.log("response="+JSON.stringify(response));
				if (response.returnValue===false && response.errorText) {
					future.result=Test.passed;
				} else {
					future.result="unexpected response "+ JSON.stringify(response);
				}
			}
		}).then(function(future) {
			result(future);
		});
	},
	testBadArgs: function(result) {
		var uri = 'palm://com.palm.db';
		var cmd = 'get';
		var args = new Boolean();
		Foundations.Comms.PalmCall.call(uri, cmd, args).then(function(future) {
			if (!future.exception) {
				future.result="No exception raised";
			} else {
				future.result=Test.passed;
			}
		}).then(function(future) {
			result(future);
		});
	},
	testArrayArgs: function(result) {
		var uri = 'palm://com.palm.db';
		var cmd = 'get';
		var args = [];
		Foundations.Comms.PalmCall.call(uri, cmd, args).then(function(future) {
			if (!future.exception) {
				future.result="No exception raised";
			} else {
				future.result=Test.passed;
			}
		}).then(function(future) {
			result(future);
		});
	}
};
