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

/*global webOS,exports */

var Posix = 
{
	mkdir: function(path, permissions) {
		var p = permissions || 0777;
		var f = new Future();
		webOS.Posix.mkdir(path, p, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("mkdir("+path+"): "+response.message);
			}
		}));
		return f;
	},
	rmdir: function(path) {
		var f = new Future();
		webOS.Posix.rmdir(path, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("rmdir("+path+"): "+response.message);
			}
		}));
		return f;
	},
	unlink: function(path) {
		var f = new Future();
		webOS.Posix.unlink(path, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("unlink("+path+"): "+response.message);
			}
		}));
		return f;
	},
	rename: function(originalName, newName) {
		var f = new Future();
		webOS.Posix.rename(originalName, newName, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("rename("+originalName+", "+newName+"): "+response.message);
			}
		}));
		return f;
	},
	system: function(cmd) {
		var f = new Future();
		webOS.Posix.system(cmd, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error("system("+cmd+"): "+response.message);
			}
		}));
		return f;
	},
	popen: function(cmd) {
		var f = new Future();
		webOS.Posix.popen(cmd, f.callback(this, function(response) {
			if (response.succeeded) {
				f.result = response;
			}
			else {
				throw new Error(response.message);
			}
		}));
		return f;
	}
};
exports.Posix = Posix;
