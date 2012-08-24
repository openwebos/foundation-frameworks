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

var Foundations = MojoLoader.require({ name: "foundations", version: "1.0" }).foundations;

var NetTests = Class.create(
{
	testNetReadBytes1: function(result)
	{
		var fd = new BinaryReader(Foundations.Comms.AjaxCall.get("http://www.google.com").getResponseStream());
		fd.readBytes(100).then(function(f)
		{
			result(f.result.length == 100 ? MojoTest.passed : "Bad length");
		})
	},

	testNetReadBytes2: function(result)
	{
		var fd = new BinaryReader(Foundations.Comms.AjaxCall.get("http://www.google.com").getResponseStream());
		fd.readBytes(100).then(function(f)
		{
			f.result = true;
		});
		fd.readBytes(100).then(function(f)
		{
			result(f.result.length == 100 ? MojoTest.passed : "Bad length");
		})
	},
});