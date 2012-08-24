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

function AssertTests() {
}

var Assert = Foundations.Assert;

AssertTests.prototype.before = function(beforeDone) {
	Assert._squelchLogs = true;
	beforeDone();
};

AssertTests.prototype.after = function(afterDone) {
	Assert._squelchLogs = false;
	afterDone();
};

AssertTests.prototype.testAssert = function testAssert() {
	// these values are all "true"
	Assert.require(Assert.assert(true));
	Assert.require(Assert.assert(1));
	Assert.require(Assert.assert("string"));
	Assert.require(Assert.assert({}));
	Assert.require(Assert.assert([]));
	// note difference from literal 0
	var n = new Number(0);
	Assert.require(Assert.assert(n));
	return Test.passed;
};

AssertTests.prototype.testAssertFail = function testAssertFail() {
	Assert.requireFalse(Assert.assert(false));
	return Test.passed;
};

AssertTests.prototype.testAssertEqual = function testAssertEqual() {
	Assert.require(Assert.assertEqual(1, 1, "Numeric compare: #{one}!=#{one}", {one: 1}));
	Assert.require(Assert.assertEqual("one", "one", "String compare: #{one}!=#{one}", {one: "1"}));
	var o1 = {a:1, b:2};
	var o2 = o1;
	Assert.require(Assert.assertEqual(o1, o2, "Object compare: #{one}!=#{two}", {one: o1, two:o2}));
	function f(a,b) {
		return a+b;
	}
	Assert.require(Assert.assertEqual(f, f, "Function compare: #{one}!=#{one}", {one: f}));
	Assert.require(Assert.assertEqual(true, true, "boolean compare: #{one}!=#{one}", {one: true}));
	Assert.require(Assert.assertEqual(undefined, undefined, "undefined compare: #{one}!=#{one}", {one: undefined}));
	Assert.require(Assert.assertEqual(null, null, "null compare: #{one}!=#{one}", {one: null}));
	Assert.require(Assert.assertEqual(null, undefined, "null/undefined compare: #{one}!=#{two}", {one: null, two: undefined}));
	return Test.passed;
};

AssertTests.prototype.testAssertEqualFail = function testAssertEqualFail() {
	Assert.requireFalse(Assert.assertEqual(1,2));
	return Test.passed;
};

AssertTests.prototype.testAssertIdentical = function testAssertIdentical() {
	Assert.require(Assert.assertIdentical(1, 1));
	Assert.require(Assert.assertIdentical("one", "one"));
	var o1 = {"a":"a", "b":"B"};
	Assert.require(Assert.assertIdentical(o1, o1));
	function f(a,b) {
		return a+b;
	}
	Assert.require(Assert.assertIdentical(f, f));
	Assert.require(Assert.assertIdentical(true, true));
	Assert.require(Assert.assertIdentical(undefined, undefined));
	Assert.require(Assert.assertIdentical(null, null));
	return Test.passed;
};

AssertTests.prototype.testAssertIdenticalFail = function testAssertIdenticalFail() {
	Assert.requireFalse(Assert.assertIdentical(1,2));
	return Test.passed;
};

AssertTests.prototype.testAssertArray = function testAssertArray() {
	Assert.require(Assert.assertArray([1]));
	var a = new Array(1,2,3);
	Assert.require(Assert.assertArray(a));
	return Test.passed;
};

AssertTests.prototype.testAssertArrayFail = function testAssertArrayFail() {
	Assert.requireFalse(Assert.assertArray({0: 1}));
	Assert.requireFalse(Assert.assertArray(1));
	// this doesn't seem quite right - somehow, the null is being converted to undefined in the message
	Assert.requireFalse(Assert.assertArray(null));
	Assert.requireFalse(Assert.assertArray(undefined));
	return Test.passed;
};

AssertTests.prototype.testAssertFalse = function testAssertFalse() {
	Assert.require(Assert.assertFalse(false));
	Assert.require(Assert.assertFalse(undefined));
	Assert.require(Assert.assertFalse(null));
	Assert.require(Assert.assertFalse(''));
	Assert.require(Assert.assertFalse(0));
	Assert.require(Assert.assertFalse(NaN));
	return Test.passed;
};

AssertTests.prototype.testAssertFalseFail = function testAssertFalseFail() {
	Assert.requireFalse(Assert.assertFalse(1===1));
	return Test.passed;
};

AssertTests.prototype.testAssertFunction = function testAssertFunction() {
	var f = function() {};
	var g= new Function("{}");
	Assert.require(Assert.assertFunction(f));
	Assert.require(Assert.assertFunction(g));
	Assert.require(Assert.assertFunction(this.testAssertFunction));
	return Test.passed;
};

AssertTests.prototype.testAssertFunctionFail = function testAssertFunctionFail() {
	Assert.requireFalse(Assert.assertFunction(1));
	return Test.passed;
};

AssertTests.prototype.testAssertString = function testAssertString() {
	Assert.require(Assert.assertString("Hello World"));
	Assert.require(Assert.assertString('foo'));
	Assert.require(Assert.assertString(''));
	var s = new String("foo");
	Assert.require(Assert.assertString(s));
	s = new String("");
	Assert.require(Assert.assertString(s));
	return Test.passed;
};

AssertTests.prototype.testAssertStringFail = function testAssertStringFail() {
	Assert.requireFalse(Assert.assertString(1));
	Assert.requireFalse(Assert.assertString(null));
	Assert.requireFalse(Assert.assertString(undefined));
	Assert.requireFalse(Assert.assertString({}));
	// Why does an empty array get printed as nothing?
	Assert.requireFalse(Assert.assertString([]));
	return Test.passed;
};

AssertTests.prototype.testAssertNumber = function testAssertNumber() {
	var n = new Number(42);
	Assert.require(Assert.assertNumber(n));
	n = new Number(0);
	Assert.require(Assert.assertNumber(n));
	Assert.require(Assert.assertNumber(3.14159));
	Assert.require(Assert.assertNumber(0));
	Assert.require(Assert.assertNumber(NaN));
	return Test.passed;
};

AssertTests.prototype.testAssertNumberFail = function testAssertNumberFail() {
	Assert.requireFalse(Assert.assertNumber(false));
	Assert.requireFalse(Assert.assertNumber("1.0"));
	return Test.passed;
};

AssertTests.prototype.testAssertClass = function testAssertClass() {
	Assert.require(Assert.assertClass(this, AssertTests));
	return Test.passed;
};

AssertTests.prototype.testAssertClassFail = function testAssertClassFail() {
	Assert.requireFalse(Assert.assertClass(1, AssertTests));
	return Test.passed;
};

AssertTests.prototype.testAssertDefined = function testAssertDefined() {
	Assert.require(Assert.assertDefined(1));
	Assert.require(Assert.assertDefined("foo"));
	Assert.require(Assert.assertDefined({a:"b"}));
	Assert.require(Assert.assertDefined({}));
	Assert.require(Assert.assertDefined(function nothing() {}));
	Assert.require(Assert.assertDefined([1,2,3]));
	Assert.require(Assert.assertDefined(null));
	return Test.passed;
};

AssertTests.prototype.testAssertDefinedFail = function testAssertDefinedFail() {
	Assert.requireFalse(Assert.assertDefined(undefined));
	return Test.passed;
};

AssertTests.prototype.testAssertMatchString = function testAssertMatchString() {
	Assert.require(Assert.assertMatch("testThis", "This"));
	return Test.passed;
};

AssertTests.prototype.testAssertMatchStringFail = function testAssertMatchStringFail() {
	Assert.requireFalse(Assert.assertMatch("one", "two"));
	return Test.passed;
};

AssertTests.prototype.testAssertMatchPattern = function testAssertMatchPattern() {
	Assert.require(Assert.assertMatch("testThis", /hi?/));
	return Test.passed;
};

AssertTests.prototype.testAssertMatchPatternFail = function testAssertMatchPatternFail() {
	Assert.requireFalse(Assert.assertMatch("one", /hi*/));
	return Test.passed;
};

AssertTests.prototype.testAssertProperty = function testAssertProperty() {
	var o = {"a": "foo", "b": "bar"};
	Assert.require(Assert.assertProperty(o, {b:"bar"}));
	return Test.passed;
};

AssertTests.prototype.testAssertPropertyFail = function testAssertPropertyFail() {
	var o = {"a": "foo", "b": "bar"};
	Assert.requireFalse(Assert.assertProperty(o, {b:"zap"}));
	return Test.passed;
};

AssertTests.prototype._thrower = function _thrower(arg) {
	throw new Error(arg);
};

AssertTests.prototype.testAssertError = function testAssertError() {
	Assert.require(Assert.assertError(this, this._thrower, ['error'], 'Error: error'));
	return Test.passed;
};

AssertTests.prototype.testAssertErrorFail = function testAssertErrorFail() {
	Assert.requireFalse(Assert.assertError(this, this._thrower, ['error'], 'blah')); 
	return Test.passed;
};

AssertTests.prototype.testAssertErrorFailByPassing = function testAssertErrorFailByPassing() {
	Assert.requireFalse(Assert.assertError(this, Test.doNothing, [], 'error')); 
	return Test.passed;
};

AssertTests.prototype.testAssertObject = function testAssertObject() {
	var someObjects = [
		{a:"b"},
		[1,2,3,4],
		new Object(),
		new Array(),
		new Boolean(false),
		new Number(1),
		new String("string")
	];
	for (var i = 0; i< someObjects.length; i++) {
		var val = someObjects[i];
		//console.log("checking..."+val);
		Assert.require(Assert.assertObject(val), "#{a} is not an Object", {a:val});
	}
	return Test.passed;
};

AssertTests.prototype.testAssertObjectFail = function testAssertObjectFail() {
	var someNonObjects = [
		null,
		undefined,
		false,
		1,
		function() {},
		"string"		
	];
	for (var i = 0; i< someNonObjects.length; i++) {
		var val = someNonObjects[i];
		//console.log("checking..."+val);
		Assert.requireFalse(Assert.assertObject(val), "#{a} is an Object", {a:JSON.stringify(val)});
	}
	return Test.passed;
};

AssertTests.prototype.testAssertJSONObject = function testAssertJSONObject() {
	var someJSONObjects = [
		{a:"b"},
		[1,2,3,4],
		new Object(),
		new Array()
	];
	for (var i = 0; i< someJSONObjects.length; i++) {
		var val = someJSONObjects[i];
		//console.log("checking..."+val);
		Assert.require(Assert.assertJSONObject(val), "#{a} is not a JSON Object", {a:val});
	}
	return Test.passed;
};

AssertTests.prototype.testAssertJSONObjectFail = function testAssertJSONObjectFail() {
	var someNonJSONObjects = [
		null,
		undefined,
		false,
		1,
		function() {},
		"string",
		new Boolean(false),
		new Number(1),
		new String("string")		
	];
	for (var i = 0; i< someNonJSONObjects.length; i++) {
		var val = someNonJSONObjects[i];
		//console.log("checking..."+val);
		Assert.requireFalse(Assert.assertJSONObject(val), "#{a} is a JSON Object", {a:JSON.stringify(val)});
	}
	return Test.passed;
};

function RequireTests() {
}

RequireTests.prototype.testRequire = function testRequire() {
	// these values are all "true"
	Assert.require(true);
	Assert.require(1);
	Assert.require("string");
	Assert.require({});
	Assert.require([]);
	// note difference from literal 0
	var n = new Number(0);
	Assert.require(n);
	return Test.passed;
};

RequireTests.prototype.testRequireFail = function testRequireFail() {
	Assert.requireError(this, Assert.require, [false, "This assertion should fail"], "Error: This assertion should fail");
	Assert.requireError(this, Assert.require, [false], 'Error: Assert.require failed');
	return Test.passed;
};

RequireTests.prototype.testRequireEqual = function testRequireEqual() {
	Assert.requireEqual(1, 1, "Numeric compare: #{one}!=#{one}", {one: 1});
	Assert.requireEqual("one", "one", "String compare: #{one}!=#{one}", {one: "1"});
	var o1 = {a:1, b:2};
	var o2 = o1;
	Assert.requireEqual(o1, o2, "Object compare: #{one}!=#{two}", {one: o1, two:o2});
	function f(a,b) {
		return a+b;
	}
	Assert.requireEqual(f, f, "Function compare: #{one}!=#{one}", {one: f});
	Assert.requireEqual(true, true, "boolean compare: #{one}!=#{one}", {one: true});
	Assert.requireEqual(undefined, undefined, "undefined compare: #{one}!=#{one}", {one: undefined});
	Assert.requireEqual(null, null, "null compare: #{one}!=#{one}", {one: null});
	Assert.requireEqual(null, undefined, "null/undefined compare: #{one}!=#{two}", {one: null, two: undefined});
	return Test.passed;
};

RequireTests.prototype.testRequireEqualFail = function testRequireEqualFail() {
	Assert.requireError(this, Assert.requireEqual, [1,2], 'Error: Assert.requireEqual: 1 != 2');
	return Test.passed;
};

RequireTests.prototype.testRequireIdentical = function testRequireIdentical() {
	Assert.requireIdentical(1, 1);
	Assert.requireIdentical("one", "one");
	var o1 = {"a":"a", "b":"B"};
	Assert.requireIdentical(o1, o1);
	function f(a,b) {
		return a+b;
	}
	Assert.requireIdentical(f, f);
	Assert.requireIdentical(true, true);
	Assert.requireIdentical(undefined, undefined);
	Assert.requireIdentical(null, null);
	return Test.passed;
};

RequireTests.prototype.testRequireIdenticalFail = function testRequireIdenticalFail() {
	Assert.requireError(this, Assert.requireIdentical, [1, 2], 'Error: Assert.requireIdentical: 1 !== 2');
	return Test.passed;
};

RequireTests.prototype.testRequireArray = function testRequireArray() {
	Assert.requireArray([1]);
	var a = new Array(1,2,3);
	Assert.requireArray(a);
	return Test.passed;
};

RequireTests.prototype.testRequireArrayFail = function testRequireArrayFail() {
	Assert.requireError(this, Assert.requireArray, [{0: 1}], 'Error: Assert.requireArray: [object Object] is not an Array');
	Assert.requireError(this, Assert.requireArray, [1], 'Error: Assert.requireArray: 1 is not an Array');
	// this doesn't seem quite right - somehow, the null is being converted to undefined in the message
	Assert.requireError(this, Assert.requireArray, null, 'Error: Assert.requireArray: undefined is not an Array');
	Assert.requireError(this, Assert.requireArray, undefined, 'Error: Assert.requireArray: undefined is not an Array');
	return Test.passed;
};

RequireTests.prototype.testRequireObject = function testRequireObject() {
	var someObjects = [
		{a:"b"},
		[1,2,3,4],
		new Object(),
		new Array(),
		new Boolean(false),
		new Number(1),
		new String("bogus")
	];
	for (var i = 0; i< someObjects.length; i++) {
		var val = someObjects[i];
		//console.log("checking..."+val);
		Assert.requireObject(val);
	}
	return Test.passed;
};

RequireTests.prototype.testRequireObjectFail = function testRequireObjectFail() {
	var someNonObjects = [
		null,
		undefined,
		false,
		1,
		function() {},
		"Excellent!"
	];
	for (var i = 0; i< someNonObjects.length; i++) {
		var val = someNonObjects[i];
		//console.log("checking..."+val);
		Assert.requireError(this, Assert.requireObject, [val]);
	}
	return Test.passed;
};

RequireTests.prototype.testRequireJSONObject = function testRequireJSONObject() {
	var someJSONObjects = [
		{a:"b"},
		[1,2,3,4],
		new Object(),
		new Array(),
	];
	for (var i = 0; i< someJSONObjects.length; i++) {
		var val = someJSONObjects[i];
		//console.log("checking..."+val);
		Assert.requireJSONObject(val);
	}
	return Test.passed;
};

RequireTests.prototype.testRequireJSONObjectFail = function testRequireJSONObjectFail() {
	var someNonJSONObjects = [
		null,
		undefined,
		false,
		1,
		function() {},
		"Excellent!",
		new Boolean(false),
		new Number(1),
		new String("bogus")
	];
	for (var i = 0; i< someNonJSONObjects.length; i++) {
		var val = someNonJSONObjects[i];
		//console.log("checking..."+val);
		Assert.requireError(this, Assert.requireJSONObject, [val]);
	}
	return Test.passed;
};

RequireTests.prototype.testRequireFalse = function testRequireFalse() {
	Assert.requireFalse(false);
	Assert.requireFalse(undefined);
	Assert.requireFalse(null);
	Assert.requireFalse('');
	Assert.requireFalse(0);
	Assert.requireFalse(NaN);
	return Test.passed;
};

RequireTests.prototype.testRequireFalseFail = function testRequireFalseFail() {
	Assert.requireError(this, Assert.requireFalse, [1==1], 'Error: Assert.requireFalse failed');
	return Test.passed;
};

RequireTests.prototype.testRequireFunction = function testRequireFunction() {
	var f = function() {};
	var g= new Function("{}");
	Assert.requireFunction(f);
	Assert.requireFunction(g);
	Assert.requireFunction(this.testRequireFunction);
	return Test.passed;
};

RequireTests.prototype.testRequireFunctionFail = function testRequireFunctionFail() {
	Assert.requireError(this, Assert.requireFunction, [1], 'Error: Assert.requireFunction: 1 is not a Function');
	return Test.passed;
};

RequireTests.prototype.testRequireString = function testRequireString() {
	Assert.requireString("Hello World");
	Assert.requireString('foo');
	Assert.requireString('');
	var s = new String("foo");
	Assert.requireString(s);
	s = new String("");
	Assert.requireString(s);
	return Test.passed;
};

RequireTests.prototype.testRequireStringFail = function testRequireStringFail() {
	Assert.requireError(this, Assert.requireString, [1], 'Error: Assert.requireString: 1 is not a String');
	Assert.requireError(this, Assert.requireString, [null], 'Error: Assert.requireString: null is not a String');
	Assert.requireError(this, Assert.requireString, [undefined], 'Error: Assert.requireString: undefined is not a String');
	Assert.requireError(this, Assert.requireString, [{}], 'Error: Assert.requireString: [object Object] is not a String');
	// Why does an empty array get printed as nothing?
	Assert.requireError(this, Assert.requireString, [[]], 'Error: Assert.requireString:  is not a String');
	return Test.passed;
};

RequireTests.prototype.testRequireNumber = function testRequireNumber() {
	var n = new Number(42);
	Assert.requireNumber(n);
	n = new Number(0);
	Assert.requireNumber(n);
	Assert.requireNumber(3.14159);
	Assert.requireNumber(0);
	Assert.requireNumber(NaN);
	return Test.passed;
};

RequireTests.prototype.testRequireNumberFail = function testRequireNumberFail() {
	Assert.requireError(this, Assert.requireNumber, [false],'Error: Assert.requireNumber: false is not a Number');
	Assert.requireError(this, Assert.requireNumber, ["1.0"],'Error: Assert.requireNumber: 1.0 is not a Number');
	return Test.passed;
};

RequireTests.prototype.testRequireClass = function testRequireClass() {
	Assert.requireClass(this, RequireTests);
	return Test.passed;
};

RequireTests.prototype.testRequireClassFail = function testRequireClassFail() {
	Assert.requireError(this, Assert.requireClass, [1, RequireTests], 'Error: Assert.requireClass: expected "RequireTests", was "Number"');
	return Test.passed;
};

RequireTests.prototype.testRequireDefined = function testRequireDefined() {
	Assert.requireDefined(1);
	Assert.requireDefined("foo");
	Assert.requireDefined({a:"b"});
	Assert.requireDefined({});
	Assert.requireDefined(function nothing() {});
	Assert.requireDefined([1,2,3]);
	Assert.requireDefined(null);
	return Test.passed;
};

RequireTests.prototype.testRequireDefinedFail = function testRequireDefinedFail() {
	Assert.requireError(this, Assert.requireDefined, [undefined],'Error: Assert.requireDefined: argument undefined');
	return Test.passed;
};

RequireTests.prototype.testRequireMatchString = function testRequireMatchString() {
	Assert.requireMatch("testThis", "This");
	return Test.passed;
};

RequireTests.prototype.testRequireMatchStringFail = function testRequireMatchStringFail() {
	Assert.requireError(this, Assert.requireMatch, ["one", "two"], 'Error: Assert.requireMatch: no match found');
	return Test.passed;
};

RequireTests.prototype.testRequireMatchPattern = function testRequireMatchPattern() {
	Assert.requireMatch("testThis", /hi?/);
	return Test.passed;
};

RequireTests.prototype.testRequireMatchPatternFail = function testRequireMatchPatternFail() {
	Assert.requireError(this, Assert.requireMatch, ["one", /hi*/], 'Error: Assert.requireMatch: no match found');
	return Test.passed;
};

RequireTests.prototype.testRequireProperty = function testRequireProperty() {
	var o = {"a": "foo", "b": "bar"};
	Assert.requireProperty(o, {b:"bar"});
	return Test.passed;
};

RequireTests.prototype.testRequirePropertyFail = function testRequirePropertyFail() {
	var o = {"a": "foo", "b": "bar"};
	Assert.requireError(this, Assert.requireProperty, [o, {b:"zap"}], 'Error: Assert.requireProperty: obj.b != zap');
	return Test.passed;
};

RequireTests.prototype._thrower = function _thrower(arg) {
	throw new Error(arg);
};

RequireTests.prototype.testRequireError = function testRequireError() {
	Assert.requireError(this, this._thrower, ['error'], 'Error: error'); 
	return Test.passed;
};

RequireTests.prototype.testRequireErrorFail = function testRequireErrorFail() {
	Assert.requireError(this, Assert.requireError, [this, this._thrower, ['error'], 'blah'], 'Error: Assert.requireError: error thrown was \'Error: error\', instead of \'blah\''); 
	return Test.passed;
};

RequireTests.prototype.testRequireErrorFailByPassing = function testRequireErrorFailByPassing() {
	Assert.requireError(this, Assert.requireError, [this, Test.doNothing, [], 'error'], 'Error: Assert.requireError: no error thrown'); 
	return Test.passed;
};
