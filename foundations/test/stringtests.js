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

var StringUtils = Foundations.StringUtils;

function StringTests() {
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
StringTests._requireObjectsEqual = function _requireObjectsEqual(first, second) {
    var p, q;
    for (p in first) {
        var val = first[p];
        switch (typeof val) {
            case 'object':
                StringTests._requireObjectsEqual(val, second[p]);
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

// The tests for the two more complex functions (camelize and parseQueryString)
// mostly use the same strings as the Prototype tests, to help make sure our
// implementations are fully compatible.
//
StringTests.prototype.testParseQueryString = function testParseQueryString(recordResults) {
    // Empty query
    //   '' -> {}
    var obj = StringUtils.parseQueryString('');
    StringTests._requireObjectsEqual(obj, {});

    // Empty query with URL
    //   foo? -> {}
    obj = StringUtils.parseQueryString("foo?");
    StringTests._requireObjectsEqual(obj, {});

    // Query with URL
    //   foo?a&b=c -> {a:undefined, b:'c'}
    obj = StringUtils.parseQueryString("foo?a&b=c");
    StringTests._requireObjectsEqual(obj, {a:undefined, b:'c'});

    // Query with URL and fragment
    //   foo?a&b=c#fragment -> {a:undefined, b:'c'}
    obj = StringUtils.parseQueryString("foo?a&b=c#fragment");
    StringTests._requireObjectsEqual(obj, {a:undefined, b:'c'});

    // Custom delimiter
    //   a;b=c -> {a:undefined, b:'c'}
    obj = StringUtils.parseQueryString("a;b=c", ";");
    StringTests._requireObjectsEqual(obj, {a:undefined, b:'c'});

    // key without value
    //   a -> {a: undefined}
    obj = StringUtils.parseQueryString("a");
    StringTests._requireObjectsEqual(obj, {a:undefined});

    // empty key
    //   a=b&=c -> {a: 'b'}
    obj = StringUtils.parseQueryString("a=b&=c");
    StringTests._requireObjectsEqual(obj, {a: 'b'});

    // empty value
    //   a=b&c= -> {a: 'b', c: ''}
    obj = StringUtils.parseQueryString("a=b&c=");
    StringTests._requireObjectsEqual(obj, {a: 'b', c: ''});

    // URL decoding
    //   a%20b=c&d=e%20f&g=h -> {'a b':'c', d: 'e f', g: 'h'}
    obj = StringUtils.parseQueryString("a%20b=c&d=e%20f&g=h");
    StringTests._requireObjectsEqual(obj, {'a b':'c', d: 'e f', g: 'h'});

    // multiple equal signs
    //   a=b=c=d -> {a: 'b=c=d'}
    obj = StringUtils.parseQueryString("a=b=c=d");
    StringTests._requireObjectsEqual(obj, {a: 'b=c=d'});

    // extra &
    //   &a=b&&&c=d -> {a: 'b', c: 'd'}
    obj = StringUtils.parseQueryString("&a=b&&&c=d");
    StringTests._requireObjectsEqual(obj, {a: 'b', c: 'd'});

    // collection
    //   col=r&col=g&col=b -> {col: ['r', 'g', 'b']}
    obj = StringUtils.parseQueryString("col=r&col=g&col=b");
    StringTests._requireObjectsEqual(obj, {col: ['r', 'g', 'b']});

    // collection with an empty
    //   c=r&c=&c=b -> {c: ['r', '', 'b']}
    obj = StringUtils.parseQueryString("c=r&c=&c=b");
    StringTests._requireObjectsEqual(obj, {c: ['r', '', 'b']});

    // Collection with empty first
    //   c=&c=b -> {c: ['', 'b']}
    obj = StringUtils.parseQueryString("c=&c=b");
    StringTests._requireObjectsEqual(obj, {c: ['', 'b']});

    // Collection with empty last
    //   c=b&c= -> {c: ['b', '']}
    obj = StringUtils.parseQueryString("c=b&c=");
    StringTests._requireObjectsEqual(obj, {c: ['b', '']});
    
    return MojoTest.passed;
};

StringTests.prototype.testCamelize = function testCamelize(recordResults) {
    // Empty string
    //   "" -> ""
    MojoTest.requireEqual(StringUtils.camelize(""), "");

    // Just a dash
    //   "-" -> ""
    MojoTest.requireEqual(StringUtils.camelize("-"), "");

    // No dashes
    //   "foo" -> "foo"
    MojoTest.requireEqual(StringUtils.camelize("foo"), "foo");

    // Underscore
    //   "foo_bar" -> "foo_bar"
    MojoTest.requireEqual(StringUtils.camelize("foo_bar"), "foo_bar");

    // Leading dash
    //   "-foo-bar" -> FooBar
    MojoTest.requireEqual(StringUtils.camelize("-foo-bar"), "FooBar");

    // Middle dash
    //   "foo-bar" -> fooBar
    MojoTest.requireEqual(StringUtils.camelize("foo-bar"), "fooBar");

    // Multiple words
    //   "foo-bar-baz" -> fooBarBaz
    MojoTest.requireEqual(StringUtils.camelize("foo-bar-baz"), "fooBarBaz");

    // Partially camelized already
    //   "fooBar-baz" -> fooBarBaz
    MojoTest.requireEqual(StringUtils.camelize("fooBar-baz"), "fooBarBaz");

    // Partially camelized at the end
    //   "foo-barBaz" -> fooBarBaz
    MojoTest.requireEqual(StringUtils.camelize("foo-barBaz"), "fooBarBaz");

    return MojoTest.passed;
};

StringTests.prototype.testStartsWith = function testStartsWith(recordResults) {
    MojoTest.require( StringUtils.startsWith("abcdefgh", "abcd") );
    MojoTest.require( StringUtils.startsWith("abcdefgh", "a") );
    MojoTest.require( StringUtils.startsWith("i", "i") );
    MojoTest.requireFalse( StringUtils.startsWith("abcdefgh", "efgh") );
    MojoTest.requireFalse( StringUtils.startsWith("abcdefgh", "h") );
    MojoTest.requireFalse( StringUtils.startsWith("j", "a") );
    return MojoTest.passed;
};

StringTests.prototype.testEndsWith = function testEndsWith(recordResults) {
    MojoTest.require( StringUtils.endsWith("abcdefgh", "efgh") );
    MojoTest.require( StringUtils.endsWith("abcdefgh", "h") );
    MojoTest.require( StringUtils.endsWith("i", "i") );
    MojoTest.requireFalse( StringUtils.endsWith("abcdefgh", "abcd") );
    MojoTest.requireFalse( StringUtils.endsWith("abcdefgh", "a") );
    MojoTest.requireFalse( StringUtils.endsWith("j", "a") );
    return MojoTest.passed;
};

StringTests.prototype.testIncludes = function testIncludes(recordResults) {
    MojoTest.require( StringUtils.includes("abcd", "bc") );
    MojoTest.require( StringUtils.includes("abcd", "a") );
    MojoTest.require( StringUtils.includes("abcd", "d") );
    MojoTest.requireFalse( StringUtils.includes("abcd", "e") );
    return MojoTest.passed;
};

StringTests.prototype.testIsBlank = function testIsBlank(recordResults) {
    MojoTest.require( StringUtils.isBlank("") );
    MojoTest.require( StringUtils.isBlank(" ") );
    MojoTest.require( StringUtils.isBlank("  ") );
    MojoTest.require( StringUtils.isBlank("\n") );
    MojoTest.require( StringUtils.isBlank("\n ") );
    MojoTest.require( StringUtils.isBlank("\t") );
    MojoTest.require( StringUtils.isBlank("\t ") );
    MojoTest.require( StringUtils.isBlank("\n\t ") );
    MojoTest.requireFalse( StringUtils.isBlank("\na\t ") );
    return MojoTest.passed;
};

StringTests.prototype.testEscapeHTML = function(reportResults) {
	var escapeHTML = StringUtils.escapeHTML;
    MojoTest.requireEqual('foo bar', escapeHTML('foo bar'));
    MojoTest.requireEqual('foo &lt;span&gt;bar&lt;/span&gt;', escapeHTML('foo <span>bar</span>'));
    MojoTest.requireEqual('foo ß bar', escapeHTML('foo ß bar'));
    MojoTest.requireEqual('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g', 
	escapeHTML('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g'));
    MojoTest.requireEqual('1\n2', escapeHTML('1\n2'));
	reportResults(MojoTest.passed);
};

StringTests.prototype.testUnescapeHTML = function(reportResults) {
	var unescapeHTML = StringUtils.unescapeHTML;
	MojoTest.requireEqual('foo bar', unescapeHTML('foo bar'));
	MojoTest.requireEqual('foo <span>bar</span>', unescapeHTML('foo &lt;span&gt;bar&lt;/span&gt;'));
	MojoTest.requireEqual('foo ß bar', unescapeHTML('foo ß bar'));

	MojoTest.requireEqual('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g',
	  unescapeHTML('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g'));

	MojoTest.requireEqual('1\n2', unescapeHTML('1\n2'));
	MojoTest.requireEqual('<h1>Pride & Prejudice</h1>', unescapeHTML('<h1>Pride &amp; Prejudice</h1>'));

	MojoTest.requireEqual('&lt;', unescapeHTML('&amp;lt;'));
	reportResults(MojoTest.passed);
};

StringTests.prototype.testStripTags = function() {
	var strip = StringUtils.stripTags;
	MojoTest.requireEqual('', strip(''));
	MojoTest.requireEqual('a few words', strip('a few words'));
	MojoTest.requireEqual('a bit more', strip('a <b>bit</b> more'));
	MojoTest.requireEqual('something nested', strip('something <div><span>nes</span>ted<div>'));
	MojoTest.requireEqual('a fake one', strip('a <asdf>fake</asdf> one'));
	MojoTest.requireEqual('something attributive', strip('<tag kind="irrelevant">something</tag> attributive'));
    return MojoTest.passed;
};

StringTests.prototype.testStripScripts = function() {
	var strip = StringUtils.stripScripts;
	MojoTest.requireEqual('', strip(''));
	MojoTest.requireEqual('a few words', strip('a few words'));
	MojoTest.requireEqual('something simple', strip('something<script>var a = "hello";</script> simple'));
	MojoTest.requireEqual('a linguistic test', strip('<script language="javascript">var b = "goodbye"</script>a linguistic test'));
	MojoTest.requireEqual('the edge case', strip('the edge case<script>var c="";</script>'));
	MojoTest.requireEqual('vast emptiness', strip('vast empt<script></script>iness'));
	MojoTest.requireEqual('multiple exposures', strip('multiple<script>asdf</script> exposures<script></script>'));

	var before = "asdf \
	<script></script>asdf";
	var after  = "asdf \
	asdf";
	MojoTest.requireEqual(after, strip(before));

	before = '<script\
	language="javascript"></script>asdf';
	after  = "asdf";
	MojoTest.requireEqual(after, strip(before));

	before = '<script language="javascript"> \
	code goes here \
	</script>asdf';
	after  = "asdf";
	MojoTest.requireEqual(after, strip(before));

    return MojoTest.passed;
};

