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

var Class = Foundations.Class;
var FutureTests2 = Class.create(
{
	testFuture1: function(result)
	{
		var f = new Future();
		f.now(function()
		{
			f.result = MojoTest.passed;
		});
		f.then(function()
		{
			f.now(function()
			{
				f.result = f.result;
			});
		});
		f.then(function()
		{
			result(f.result);
		});
	},
	
	testFuture2: function(result)
	{
		function a(f)
		{
			f.nest(new Future().now(function(f2)
			{
				setTimeout(function()
				{
					f2.result = null;
				}, 100);
			}));
			f.then(function()
			{
				f.result = null;
			});
		}
		
		function b(f)
		{
			f.now(this, function(f1)
			{
				a(f1);
			});
			f.then(this, function(f1)
			{
				f1.result = null;
			});
		}
		
		var future = new Future();
		
		future.now(function(f)
		{
			f.nest(new Future().now(function(f2)
			{
				setTimeout(function()
				{
					f2.result = null;
				}, 100);
			}));
		});
		future.then(function(f)
		{
			b(f);
		});
		future.then(function()
		{
			result(MojoTest.passed);
		});
	}
});