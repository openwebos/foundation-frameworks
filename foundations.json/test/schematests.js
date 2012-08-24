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

var webos = require("webos");
webos.include("test/loadall.js");

var SchemaTests = function()
{
}
function makePassTest(name, obj, schema)
{
	makeTest(name, obj, schema, undefined);
}
function makeFailTest(name, obj, schema, fail)
{
	makeTest(name, obj, schema, fail);
}
function makeTest(name, obj, schema, fail)
{
	SchemaTests.prototype["testSchema" + name] = function()
	{
		var v = exports.Schema.validate(obj, schema);
		if (v.valid && !fail)
		{
			return MojoTest.passed;
		}
		else
		{
			var e = JSON.stringify(v.errors);
			if (fail && fail === e)
			{
				return MojoTest.passed;
			}
			else
			{
				return "errors: " + e + " expected:" + fail;
			}
		}
	}
}

var s1 = 
{
	"description":"A person",
 	"type":"object",

 	"properties":
  	{
		"name": {"type":"string"},
   		"age" : {"type":"integer", "maximum":125}
	}
};

makePassTest("A1", {}, {});
makeFailTest("A2", {}, s1, '[{"property":"name","message":"is missing and it is not optional"},{"property":"age","message":"is missing and it is not optional"}]');
makeFailTest("A3", { age: 10 }, s1, '[{"property":"name","message":"is missing and it is not optional"}]');
makePassTest("A4", { age: 10, name: 'bob'}, s1);
makeFailTest("A5", { age: 200, name: 'bob' }, s1, '[{"property":"age","message":"must have a maximum value of 125"}]');
makeFailTest("A6", [], s1, '[{"property":"","message":"an object is required"}]');

makePassTest("B1", [], { type: "array" });
makeFailTest("B2", [], { type: "object" }, '[{"property":"","message":"an object is required"}]');
makeFailTest("B3", { age: 10, name: 'bob' }, { type: "array" }, '[{"property":"","message":"object value found, but a array is required"}]');

var s2 =
{
	"description":"A person",
 	"type":"object",

 	"properties": 
	{
    	"name": {"type":"string"},
    	"born" : 
		{
			"type": ["integer","string"], //allow for a numeric year, or a full date
       		"minimum": 1900, // min/max for when a numberic value is used
       		"maximum": 2010,
       		"format": "date-time", // format when a string value is used
       		"optional": true
		},
    	"gender" : 
		{
			"type":"string",
          	"options":
			[
          		{"value": "male", "label":"Guy"},
				{"value": "female", "label":"Gal"}
			]
		},
    	"address" : 
		{
			"type":"object",
           	"properties":
			{
           		"street":{"type":"string"},
               	"city":{"type":"string"},
               	"state":{"type":"string"}
         	}
     	}
	}
}

makePassTest("C1", {
  "name" : "John Doe",
  "born" : "",
  "gender" : "male",
  "address" : 
   {"street":"123 S Main St",
    "city":"Springfield",
    "state":"CA"}
}, s2);

makePassTest("D1", 
	{ "msg": "hello", "extra": true }, 
	{ "type": "object", "properties": { "msg": { "type": "string" } } }
);
makeFailTest("D2", 
	{ "msg": "hello", "extra": true }, 
	{ "type": "object", "properties": { "msg": { "type": "string" } }, "additionalProperties": false },
	'[{"property":"","message":"The property extra is not defined in the schema and the schema does not allow additional properties"}]'
);
