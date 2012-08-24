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

var ObjectUtils = Foundations.ObjectUtils;

function ObjectTests() {
}

// 
// return MojoTest.passed if:
//   For all non-function properties p in first:
//     second[p] exists and second[p] === first[p]
//
//   AND
//
//   For all non-function properties q in second:
//     first[q] exists
//
// (We don't actually need to check that the properties are equal in value
//  in the second loop, since if first[q] exists, it would have been checked
//  in the first loop.)
ObjectTests._requireObjectsEqual = function _requireObjectsEqual(first, second) {
    var p, q;
    for (p in first) {
        var val = first[p];
        switch (typeof val) {
            case 'object':
                ObjectTests._requireObjectsEqual(val, second[p]);
                break;

            case 'function':
                // Don't really care about functions
                break;

            default:
                var testObj = {};
                testObj[p] = first[p];
                MojoTest.requireProperty(second, testObj);
        }
    }

    for (q in second) {
        var val = second[q];
        if (typeof val !== 'function') {
            MojoTest.require( first.hasOwnProperty(q), "first object has no property " + q );
        }
    }

    return MojoTest.passed;
};

ObjectTests.prototype.testType = function (recordResults) {
    MojoTest.requireIdentical( "null", ObjectUtils.type(null) );
    MojoTest.requireIdentical( "undefined", ObjectUtils.type(undefined) );
    MojoTest.requireIdentical( "number", ObjectUtils.type(3) );
    MojoTest.requireIdentical( "number", ObjectUtils.type(16.2) );
    MojoTest.requireIdentical( "string", ObjectUtils.type("i'm a string") );
    MojoTest.requireIdentical( "boolean", ObjectUtils.type(true) );
    MojoTest.requireIdentical( "boolean", ObjectUtils.type(false) );
    MojoTest.requireIdentical( "array", ObjectUtils.type([]) );
    MojoTest.requireIdentical( "array", ObjectUtils.type([1, 2, 3]) );
    MojoTest.requireIdentical( "function", ObjectUtils.type(function(){}) );
    MojoTest.requireIdentical( "object", ObjectUtils.type({}) );
    MojoTest.requireIdentical( "object", ObjectUtils.type({a: 'b', c: 2.3}) );
    return MojoTest.passed;
};

ObjectTests.prototype.testClone = function (recordResults) {
    // Single values of any kind clone to themselves.
    var singles = [ null, undefined, 8.6, true, "i'm a string", function(a) { return a; } ];
    var len = singles.length;
    var val;
    for (var i=0; i<len; ++i) {
        val = singles[i];
        MojoTest.requireIdentical(val, ObjectUtils.clone(val));
    }

    // Functions clone to undefined if you choose to ignore them.
    MojoTest.requireIdentical(undefined, ObjectUtils.clone(function(){}, {ignoreFunctions: true}));

    // Arrays should clone to themselves as well, even if they contain weird stuff.
    ObjectTests._requireObjectsEqual(singles, ObjectUtils.clone(singles));

    // Empty arrays should work.
    ObjectTests._requireObjectsEqual([], ObjectUtils.clone([]));
    
    // Unless you ask to ignore empty arrays.
    MojoTest.requireIdentical(undefined, ObjectUtils.clone([], {ignoreEmptyArrays: true}));

    // Objects should usually clone to themselves.
    val = { a: 'b' };
    ObjectTests._requireObjectsEqual(val, ObjectUtils.clone(val));

    // Including empty objects.
    val = { };
    ObjectTests._requireObjectsEqual(val, ObjectUtils.clone(val));

    // But you can request to ignore empty objects.
    MojoTest.requireIdentical(undefined, ObjectUtils.clone(val, {ignoreEmptyObjects: true}));

    // You can also ignore properties that start with '_'.
    val = { a: 'b', _c: 'd' };
    var cloned = { a: 'b' };
    ObjectTests._requireObjectsEqual(cloned, ObjectUtils.clone(val, {ignoreUnderscoreProperties: true}));

    // Even objects with weird things in them should work.
    val = { a: null, b: undefined, c: 8.6, d: true, e: "i'm a string", f: function(a){return a;} };
    ObjectTests._requireObjectsEqual(val, ObjectUtils.clone(val));

    // There's also something called a partial object.  Tests for that situation should go here.
    
    return MojoTest.passed;
};

ObjectTests.prototype.testToQueryString = function(recordResults) {
    // Perform most of the StringUtils.parseQueryString tests in reverse.
    // Of course, some of them don't make sense, and some new ones are
    // necessary.

    // Empty object
    //   {} -> ''
    var str = ObjectUtils.toQueryString({});
    MojoTest.requireIdentical(str, '');

    // Single item
    //   {a: 'b'} -> a=b
    str = ObjectUtils.toQueryString({a: 'b'});
    MojoTest.requireIdentical(str, 'a=b');

    // Multiple items
    //   {a: 'b', c: 'd'} -> a=b&c=d
    str = ObjectUtils.toQueryString({a: 'b', c: 'd'});
    MojoTest.requireIdentical(str, 'a=b&c=d');

    // key without value
    //   {a: undefined} -> a
    str = ObjectUtils.toQueryString({a: undefined});
    MojoTest.requireIdentical(str, 'a');

    // empty value
    //   {a: 'b', c: ''} -> a=b&c=
    str = ObjectUtils.toQueryString({a: 'b', c: ''});
    MojoTest.requireIdentical(str, 'a=b&c=');

    // Functions in objects
    //   {a: 'b', c: function () { return 'd'; } } -> a=b
    str = ObjectUtils.toQueryString({a: 'b', c: function() { return 'd'; }});
    MojoTest.requireIdentical(str, 'a=b');

    // Objects within objects 
    //   {a: 'b', c: { d: 'e' } } -> a=b
    str = ObjectUtils.toQueryString({a: 'b', c: { d: 'e'}});
    MojoTest.requireIdentical(str, 'a=b');

    // Numbers as values
    //   {a: 42, b: 4.7} -> "a=42&b=4.7"
    str = ObjectUtils.toQueryString({a: 42, b: 4.7});
    MojoTest.requireIdentical(str, 'a=42&b=4.7');

    // Strings as values
    //   {a: 'this is a string'} -> "a=this%20is%20a%20string"
    str = ObjectUtils.toQueryString({a: 'this is a string'});
    MojoTest.requireIdentical(str, 'a=this%20is%20a%20string');

    // Booleans as values
    //   {a: true, b: false} -> "a=true&b=false"
    str = ObjectUtils.toQueryString({a: true, b: false});
    MojoTest.requireIdentical(str, 'a=true&b=false');

    // URL decoding
    //   {'a b':'c', d: 'e f', g: 'h'} -> a%20b=c&d=e%20f&g=h
    str = ObjectUtils.toQueryString({'a b':'c', d: 'e f', g: 'h'});
    MojoTest.requireIdentical(str, "a%20b=c&d=e%20f&g=h");

    // collection
    //   {col: ['r', 'g', 'b']} -> col=r&col=g&col=b
    str = ObjectUtils.toQueryString({col: ['r', 'g', 'b']});
    MojoTest.requireIdentical(str, "col=r&col=g&col=b");

    // collection with an empty
    //   {c: ['r', '', 'b']} -> c=r&c=&c=b
    str = ObjectUtils.toQueryString({c: ['r', '', 'b']});
    MojoTest.requireIdentical(str, "c=r&c=&c=b");

    // Collection with empty first
    //   {c: ['', 'b']} -> c=&c=b
    str = ObjectUtils.toQueryString({c: ['', 'b']});
    MojoTest.requireIdentical(str, "c=&c=b");

    // Collection with empty last
    //   {c: ['b', '']} -> c=b&c=
    str = ObjectUtils.toQueryString({c: ['b', '']});
    MojoTest.requireIdentical(str, "c=b&c=");
    
    return MojoTest.passed;
};
