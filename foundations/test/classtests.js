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

function ClassTests()
{
}

ClassTests.prototype.testClass1 = function()
{
	var cls = Class.create();
	return MojoTest.passed;
}

ClassTests.prototype.testClass2 = function()
{
	var cls = Class.create();
	var obj = new cls();
	return MojoTest.passed;
}

ClassTests.prototype.testClass3 = function()
{
	var cls = Class.create(
	{
		method1: function()
		{
			return MojoTest.passed;
		}
	});
	var obj = new cls();
	return obj.method1();
}

ClassTests.prototype.testClass4 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return MojoTest.passed;
		}
	});
	var cls = Class.create(cls1,
	{
	});
	var obj = new cls();
	return obj.method1();
}

ClassTests.prototype.testClass5 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return "Wrong method";
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function()
		{
			return MojoTest.passed;
		}
	});
	var obj = new cls();
	return obj.method1();
}

ClassTests.prototype.testClass6 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return MojoTest.passed;
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return this.$super(method1)();
		}
	});
	var obj = new cls();
	return obj.method1();
}

ClassTests.prototype.testClass7 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return 1;
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return 2 + this.$super(method1)();
		}
	});
	var obj = new cls();
	return obj.method1() == 3 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass8 = function()
{
	var cls = Class.create(
	{
		method1: function()
		{
			return this.value;
		}
	});
	var obj1 = new cls();
	var obj2 = new cls();
	obj1.value = 1;
	obj2.value = 2;
	return obj1.method1() + obj2.method1() == 3 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass8 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return this.value;
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return 100 + this.$super(method1)();
		}
	});
	var obj1 = new cls();
	var obj2 = new cls();
	obj1.value = 1;
	obj2.value = 2;
	return obj1.method1() + obj2.method1() == 203 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass9 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return this.value;
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return 100 + this.$super(method1)();
		}
	});
	var obj1 = new cls();
	var obj2 = new cls();
	obj1.value = 1;
	obj2.value = 2;
	return obj1.method1() + obj2.method1() + obj1.method1() + obj2.method1() == 406 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass10 = function()
{
	var cls2 = Class.create(
	{
		method1: function()
		{
			return 1;
		}
	});
	var cls1 = Class.create(cls2,
	{
		method1: function method1()
		{
			return 2 + this.$super(method1)();
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return 4 + this.$super(method1)();
		}
	});
	var obj = new cls();
	return obj.method1() == 7 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass11 = function()
{
	var cls2 = Class.create(
	{
		method1: function()
		{
			return 1;
		}
	});
	var cls1 = Class.create(cls2,
	{
		method_we_dont_call: function()
		{
			return 9999;
		}
	});
	var cls = Class.create(cls1,
	{
		method1: function method1()
		{
			return 4 + this.$super(method1)();
		}
	});
	var obj = new cls();
	return obj.method1() == 5 ? MojoTest.passed : "Error";
}

ClassTests.prototype.testClass12 = function()
{
	var cls1 = Class.create(
	{
		method1: function()
		{
			return 1;
		}
	});
	var clsB = Class.create(cls1,
	{
		method1: function method1()
		{
			return 2 + this.$super(method1)();
		}
	});
	var clsA = Class.create(cls1,
	{
		method1: function method1()
		{
			return 4 + this.$super(method1)();
		}
	});
	var obj1 = new clsA();
	var obj2 = new clsB();
	return obj1.method1() + obj2.method1() == 8 ? MojoTest.passed : "Error";
}