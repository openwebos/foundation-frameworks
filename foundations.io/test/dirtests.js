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

var DirTests = Class.create(
{
	testDir1: function(report)
	{
		var result =
		{
			"test/dir/one": true,
			"test/dir/two": true,
			"test/dir/three": true,
			"test/dir/four/": true,
			"test/dir/four/five": false,
			"test/dir/six": true,
		};
		Directory.getFiles("test/dir").then(function(future)
		{
			var files = future.result
			for (var i = 0; i < files.length; i++)
			{
				var file = files[i];
				if (result[file] === true)
				{
					delete result[file];
				}
				else
				{
					result[file] = "error";
				}
			}
			for (var k in result)
			{
				if (result[k] !== false)
				{
					report("List of files incorrect: first incorrect file: " + k);
					return;
				}
			}
			report(MojoTest.passed);
		});
	},
	
	testDir2: function(report)
	{
		Directory.getFiles("test/dir", /^o.*/).then(function(future)
		{
			var files = future.result
			report(files.length == 1 && files[0] == "test/dir/one" ? MojoTest.passed : "Error: " + files.toString());
		});
	},
	
	testDir3: function(report)
	{
		var result =
		{
			"test/dir/one": true,
			"test/dir/two": true,
			"test/dir/three": true,
			"test/dir/four/": true,
			"test/dir/four/five": false,
			"test/dir/six": true,
		};
		Directory.getFiles("test/dir", undefined, SearchOptions.top).then(function(future)
		{
			var files = future.result
			for (var i = 0; i < files.length; i++)
			{
				var file = files[i];
				if (result[file] === true)
				{
					delete result[file];
				}
				else
				{
					result[file] = "error";
				}
			}
			for (var k in result)
			{
				if (result[k] !== false)
				{
					report("List of files incorrect: first incorrect file: " + k);
					return;
				}
			}
			report(MojoTest.passed);
		});
	},

	testDir4: function(report)
	{
		var result =
		{
			"test/dir/one": true,
			"test/dir/two": true,
			"test/dir/three": true,
			"test/dir/four/": true,
			"test/dir/four/five": true,
			"test/dir/six": true,
		};
		Directory.getFiles("test/dir", undefined, SearchOptions.all).then(function(future)
		{
			var files = future.result
			for (var i = 0; i < files.length; i++)
			{
				var file = files[i];
				if (result[file] === true)
				{
					delete result[file];
				}
				else
				{
					result[file] = "error";
				}
			}
			for (var k in result)
			{
				if (result[k] !== false)
				{
					report("List of files incorrect: first incorrect file: " + k);
					return;
				}
			}
			report(MojoTest.passed);
		});
	},
});