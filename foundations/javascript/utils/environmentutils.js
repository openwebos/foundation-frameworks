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

var EnvironmentUtils = exports.EnvironmentUtils = {
	runtime: function() {
		if (typeof root !== "undefined" && root.process && root.process.version) {
			return "node";
		}
		
		if (typeof webOS !== "undefined") {
			return "triton";
		}
		
		return "browser";
	},
	
	isBrowser: function() {
		return this.runtime() === "browser";
	},
	
	isTriton: function() {
		return this.runtime() === "triton";
	},
	
	isNode: function() {
		return this.runtime() === "node";
	}
};