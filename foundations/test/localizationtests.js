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

var create$L=Foundations.Localization.create$L;

var base = "test/"

function LocTests()
{
}

LocTests.prototype.testLoc1 = function()
{
	var $L = create$L(base);
	return $L("hello") == "hello" ? Test.passed : "failed";
}

LocTests.prototype.testLoc2 = function()
{
	var $L = create$L(base, "en_us");
	return $L("hello") == "hello" ? Test.passed : "failed";
}

LocTests.prototype.testLoc3 = function()
{
	var $L = create$L(base, "en_gb");
	return $L("hello") == "what ho" ? Test.passed : "failed";
}

LocTests.prototype.testLoc4 = function()
{
	var $L = create$L(base, "es");
	return $L("ticket") == "billete" ? Test.passed : "failed";
}

LocTests.prototype.testLoc5 = function()
{
	var $L = create$L(base, "es_mx");
	return $L("ticket") == "boleto" ? Test.passed : "failed";
}

LocTests.prototype.testLoc6 = function()
{
	var $L = create$L(base, "es_xx");
	return $L("ticket") == "billete" ? Test.passed : "failed";
}

LocTests.prototype.testLoc7 = function()
{
	var $L = create$L(base, "es_xx");
	return $L("hello") == "hello" ? Test.passed : "failed";
}