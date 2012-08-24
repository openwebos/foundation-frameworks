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

var PosixTests = function PosixTests() {
};

PosixTests.prototype = {
	before: function(callback) {
		this.path = "/tmp/posixtests"+Math.floor(Math.random()*99999);
		Posix.mkdir(this.path).then(function() {
			callback();
		});
	},
	after: function(callback) {
		Posix.rmdir(this.path).then(function() {
			callback();
		});
	},
	report_from_future: function(future, callback) {
		if (!future.exception) {
			callback(Test.passed);
		} else {
			callback(future.exception);
		}
	},
	test_mkdir_rmdir: function(reportResult) {
		var that = this;
		var path=this.path+"/test";
		Posix.mkdir(path).then(function(future) {
			future.nest(Posix.rmdir(path));
		}).then(function(future) {
			that.report_from_future(future, reportResult); 
		});
	},
	test_system: function(reportResult) {
		var that = this;
		var path = this.path+"/system";
		Posix.system("touch "+path).nest(
			Posix.system("rm "+path)
		).then(function(future) {
			that.report_from_future(future, reportResult); 
		});
	},
	test_unlink: function(reportResult) {
		var path = this.path+"/unlink";
		var that = this;
		Posix.system("touch "+path).nest(Posix.unlink(path)).then(function(future) {
			that.report_from_future(future, reportResult); 
		});
	},
	test_rename: function(reportResult) {
		var path = this.path+"/rename";
		var that = this;
		Posix.system("touch "+path).nest(Posix.rename(path, path+"d").nest(Posix.unlink(path+"d"))).then(function(future) {
			that.report_from_future(future, reportResult); 
		});
	},
	test_popen: function(reportResult) {
		var path = this.path+"/popen";
		var that = this;
		Posix.system("touch "+path).nest(
			Posix.popen("ls "+that.path).nest(
				Posix.unlink(path)
			)
		).then(
			function(future) {
				that.report_from_future(future, reportResult); 
			}
		);
	}, 
	test_chain: function(reportResult) {
		var path = this.path+"/chain";
		var that=this;
		Posix.mkdir(path).then(
			that,
			function(future) {
				future.nest(Posix.mkdir(path+"/sub")).then(
					that,
					function(future) {
						future.result=Test.passed;
				});
		}).then(
			that,
			function(future) {
				reportResult(future);
			}
		);
	}
};
