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

var FileTests = Class.create(
{
	testFile1: function()
	{
		var f = File.open("test/read/test.bin", "r");
		return MojoTest.passed;
	},
	
	testFile2: function()
	{
		try
		{
			var f = File.open("test/read/file_does_not_exist", "r");
			return "Opened non-existant file";
		}
		catch (e)
		{
			if (e.name == "IOError")
			{
				return MojoTest.passed;
			}
			return e;
		}
	},
	
	testFileStream1: function(result)
	{
		var fd = new BinaryReader(File.open("test/read/test.bin", "r"));
		fd.readInt32().then(function(f)
		{
			result(f.result == 825373492 ? MojoTest.passed : "Bad value: " + f.result);
			fd.close();
		});
	},

	testFileStream2: function(result)
	{
		var fd = new BinaryReader(File.open("test/read/zero.bin", "r"));
		var count = 0;
		fd.readByte().then(function fn(f)
		{
			try
			{
				f.result;
				count++;
				fd.readByte().then(fn);
			}
			catch (e)
			{
				if (e.constructor != EOSError)
				{
					result("Bad exception");
				}
				else if (count == 8192)
				{
					result(MojoTest.passed);
				}
				else
				{
					result("Bad count: " + count);
				}
				fd.close();
			}
		});
	},
	
	testFileStream3: function(result)
	{
		var fd = new BinaryReader(File.open("test/read/zero.bin", "r"));
		var count = 0;
		fd.readBytes(1).then(function fn(f)
		{
			try
			{
				f.result;
				count++;
				fd.readBytes(1).then(fn);
			}
			catch (e)
			{
				if (e.constructor != EOSError)
				{
					result("Bad exception");
				}
				else if (count == 8192)
				{
					result(MojoTest.passed);
				}
				else
				{
					result("Bad count: " + count);
				}
				fd.close();
			}
		});
	},
	
	testReadBytes1: function(result)
	{
		var fd = new BinaryReader(File.open("test/read/testbytes", "r"));
		fd.readBytes(10).then(function(f)
		{
			var t = "helloworld";
			for (var i = 0; i < 10; i++)
			{
				if (f.result[i] != t.charCodeAt(i))
				{
					result("Bad value: " + i + "," + f.result[i] + "," + t.charCodeAt(i));
					return;
				}
			}
			result(MojoTest.passed);
		})
	},
	
	testReadBytes2: function(result)
	{
		var fd = new BinaryReader(File.open("test/read/testbytes", "r"));
		fd.readBytes(100).then(function(f)
		{
			var t = "helloworld";
			for (var i = 0; i < f.result.length; i++)
			{
				if (f.result[i] != t.charCodeAt(i))
				{
					result("Bad value: " + i + "," + f.result[i] + "," + t.charCodeAt(i));
					return;
				}
			}
			result(MojoTest.passed);
		})
	},

	testBufferedStream1: function(result)
	{
		var fd = new BinaryReader(new BufferedStream(File.open("test/read/test.bin", "r")));
		fd.readInt32().then(function(f)
		{
			result(f.result == 825373492 ? MojoTest.passed : "Bad value: " + f.result);
			fd.close();
		});
	},
	
	testBufferedStream2: function(result)
	{
		var fd = new BinaryReader(new BufferedStream(File.open("test/read/zero.bin", "r")));
		var count = 0;
		fd.readByte().then(function fn(f)
		{
			try
			{
				f.result;
				count++;
				fd.readByte().then(fn);
			}
			catch (e)
			{
				if (e.constructor != EOSError)
				{
					result("Bad exception: " + e);
				}
				else if (count == 8192)
				{
					result(MojoTest.passed);
				}
				else
				{
					result("Bad count: 8192 != " + count);
				}
				fd.close();
			}
		});
	},
	
	testBufferedStream3: function(result)
	{
		var fd = new BinaryReader(new BufferedStream(File.open("test/read/zero.bin", "r")));
		var count = 0;
		fd.readBytes(1).then(function fn(f)
		{
			try
			{
				if (f.result.length == 0)
				{
					throw new EOSError();
				}
				count++;
				fd.readBytes(1).then(fn);
			}
			catch (e)
			{
				if (e.constructor != EOSError)
				{
					result("Bad exception: " + e);
				}
				else if (count == 8192)
				{
					result(MojoTest.passed);
				}
				else
				{
					result("Bad count: 8192 != " + count);
				}
				fd.close();
			}
		});
	},

	testBufferedReadBytes1: function(result)
	{
		var fd = new BinaryReader(new BufferedStream(File.open("test/read/testbytes", "r")));
		fd.readBytes(10).then(function(f)
		{
			var t = "helloworld";
			for (var i = 0; i < 10; i++)
			{
				if (f.result[i] != t.charCodeAt(i))
				{
					result("Bad value: " + i + "," + f.result[i] + "," + t.charCodeAt(i));
					return;
				}
			}
			result(MojoTest.passed);
		})
	},
	
	testBufferedReadBytes2: function(result)
	{
		var fd = new BinaryReader(new BufferedStream(File.open("test/read/testbytes", "r")));
		fd.readBytes(100).then(function(f)
		{
			var t = "helloworld";
			for (var i = 0; i < f.result.length; i++)
			{
				if (f.result[i] != t.charCodeAt(i))
				{
					result("Bad value: " + i + "," + f.result[i] + "," + t.charCodeAt(i));
					return;
				}
			}
			result(MojoTest.passed);
		})
	},
	
	testFileExists: function(result) {
		function testExists(path, expectedResult, callback) {
			if (File.exists(path) !== expectedResult) {
				if (expectedResult) {
					callback("'" + path + "' was expected to exist, but didn't.");
				}
				callback("'" + path + "' wasn't expected to exist, but did.");
				return false;
			}
			return true;
		}
		var thingsToTest = [
			{path: "test/dir/four", expected: true},
			{path: "test/dirx/four", expected: false},
			{path: "test/dir/one", expected: true},
			{path: "test/dir/one1", expected: false}
		];
		var failed = false;
		thingsToTest.forEach(function(o) {
			if (!failed && !testExists(o.path, o.expected, result)) {
				failed = true;
			}			
		});
		if (!failed) {
			result(MojoTest.passed);			
		}
	}

});

FileTests.timeoutInterval = 20000;