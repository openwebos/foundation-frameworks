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

/*global exports*/

/** section: Foundations
 * StringUtils
 * This namespace defines several functions that operate on strings and are
 * intended to replace functions from the Prototype library.  They are intended
 * to be fully compatible with the Prototype versions.
 **/
var StringUtils = exports.StringUtils = {
    /** 
    * StringUtils.parseQueryString(str[, separator]) -> Object
    * - str (String): A URI query string.
    * - separator (String): If provided, a string representing the separator
    * between key/value pairs in the query string.  Defaults to '&'.
    *
    * parseQueryString takes a string of the form
    * `doc?key1=value%20one&key2=val2#anchor` and turns it into an object like
    * `{ 'key1': 'value one', 'key2': 'val2' }`.  It replaces the Prototye function
    * String#toQueryParams and its alias String#parseQuery.
    **/
    parseQueryString: function parseQueryString( str, separator ) {
        // The Prototype function accepts document parts ("something?") on the
        // front, as well as fragments ("#blah") on the back.  Start by removing
        // them.
        var queryStart = str.indexOf('?');
        var queryEnd = str.indexOf('#');

        // If there's a ? in the string, the query part starts 1 char after it.
        // Otherwise, it starts at the beginning.require ../luna/luna-app-common.inc

        queryStart = (queryStart > -1) ? queryStart+1 : 0;
        queryEnd = (queryEnd > -1) ? queryEnd : str.length;
        str = str.substring(queryStart, queryEnd);

        var sep = separator || '&';
        var obj = {};

        // Split the string into pairs by separator
        var pairs = str.split(sep);
        var len = pairs.length;

        // For each pair, split into key and value.
        for (var i=0; i<len; ++i) {
            var pieces = pairs[i].split("=");
            var key = decodeURIComponent(pieces.shift());

            // If there's more than 1 "piece" left, join them all with "=".
            // If there's only 1, just use it.
            var value = undefined;
            if (pieces.length > 0) {
                if (pieces.length > 1) {
                    value = pieces.join("=");
                } else {
                    value = pieces[0];
                }
                value = decodeURIComponent(value);
            }
            if (key) {
                if (obj.hasOwnProperty(key)) {
                    var oldval = obj[key];
                    if (ObjectUtils.type(oldval) === "array") {
                        oldval.push(value);
                    } else {
                        oldval = [oldval, value];
                    }

                    obj[key] = oldval;
                }
                else {
                    obj[key] = value;
                }
            }
        }

        return obj;
    },

    /** 
    * StringUtils.camelize(str) -> String
    * - str (String): A string to camelize.
    *
    * camelize takes a string with words separated by '-' and turns it into
    * CamelCase.  For example:
    *
    *     'some-string'.camelize(); // becomes someString
    *     '-some-other-string'.camelize(); // becomes SomeOtherString
    **/
    camelize: function camelize( str ) {
        // Per the prototype docs:
        // 'background-color'.camelize();
        //    -> 'backgroundColor'
        // '-moz-binding'.camelize();
        //    -> 'MozBinding'
        //
        // Per prototype's behavior:
        // 'background-color-'.camelize();
        //    -> 'backgroundColor'
        
        // So, find every /-(.)/ and replace with \1.toUpperCase().
        // Except that we want to behave the same way as prototype with 
        // a - at the end.  So make the extra character optional.
        return str.replace(/-(.?)/g, function(wholeMatch, firstChar) { 
            if (!firstChar) {
                return '';
            }
            return firstChar.toUpperCase();
        });
    },

    /** 
    * StringUtils.startsWith(str, substring) -> Boolean
    * - str (String): The string being searched.
    * - substring (String): The string being searched for.
    *
    * startsWith checks whether a given string starts with a given substring.  It
    * can be thought of as another way of saying:
    *     str.indexOf(substring) === 0
    **/
    startsWith: function startsWith(str, substring) {
        return (str.indexOf(substring) === 0);
    },

    /** 
    * StringUtils.endsWith(str, substring) -> Boolean
    * - str (String): The string being searched.
    * - substring (String): The string being searched for.
    *
    * endsWith checks whether a given string ends with a given substring.
    **/
    endsWith: function endsWith(str, substring) {
        // If str is going to end with substring, then the difference in
        // lengths is where substring has to start.
        var startIdx = str.length - substring.length;
        
        // If substring is longer than str, then clearly str can't
        // end with substring.  Otherwise, substring must start right at
        // startIdx.
        return (startIdx >= 0) && (str.indexOf(substring, startIdx) === startIdx);
    },

    /** 
    * StringUtils.isBlank(str) -> Boolean
    * - str (String): The string to check for blankness.
    *
    * Checks whether a string is blank.  A string is considered blank when it
    * consists entirely of zero or more whitespace characters.
    **/
    isBlank: function isBlank( str ) {
        // Use RegExp.test to check since we don't care about the matching string.
        return (/^\s*$/).test(str);
    },

    /**
    * StringUtils.includes(str, substring) -> Boolean
    * - str (String): The string being searched.
    * - substring (String): The string being searched for.
    *
    * Checks whether a given substring appears anywhere within a given string.
    **/
    includes: function includes(str, substring) {
        return (str.indexOf(substring) !== -1);
    },

	entityRegex: /[<>&]/g,
	unentityRegex: /(&lt;)|(&gt;)|(&amp;)/g,
	
	escapeCharacterMap: {
		"<":"&lt;",
		">":"&gt;",
		"&":"&amp;",
		"\"":"&quot;",
		"'":"&apos;"
	},
	
	unescapeCharacterMap: {
		"&lt;": "<",
		"&gt;": ">",
		"&amp;": "&",
		"&quot;": "\"",
		"&apos;": "'"
	},
	
	escapeCommon: function(stringToEscape, regex, characterMap) {
		function replaceFromMap(c) {
			return characterMap[c];
		}
		return stringToEscape.replace(regex, replaceFromMap);
	},
	
	/**
	 * StringUtils.escapeHTML(stringToEscape) -> String
	 * - stringToEscape (String): The string whose content is to be escaped.
	 *
	 * This function escapes the content in order to make it safe to insert into HTML. It does so
	 *  by replacing "<", ">" and "&" with their entity forms "&lt;", "&gt;" and "&amp;".
	 **/
	escapeHTML: function(stringToEscape) {
		return StringUtils.escapeCommon(stringToEscape, StringUtils.entityRegex, StringUtils.escapeCharacterMap);
	},
	
	/**
	 * StringUtils.unescapeHTML(stringToEscape) -> String
	 * - stringToUnescape (String): The string whose content is to be unescaped.
	 *
	 * This function undoes the effects of StringUtils.escapeHTML().
	 **/
	unescapeHTML: function(stringToUnescape) {
		return StringUtils.escapeCommon(stringToUnescape, StringUtils.unentityRegex, StringUtils.unescapeCharacterMap);
	},

	/**
	 * StringUtils.stripTags(str) -> String
	 * - str (String): The string to remove tags from.
	 *
	 * This function removes all HTML tags and anything that looks like an HTML
	 * tag from a string and returns the result.
	 **/
	stripTags: function(str) {
		return str.replace(/<\/?[^>]+>/gi, '');
	},
	
	/**
	 * StringUtils.stripScripts(str) -> String
	 * - str (String): The string to remove scripts from.
	 *
	 * This function removes all script code from a string.  Script code is
	 * defined as "anything inside <script> tags", so be sure to call
	 * stripScripts() before stripTags() if you're using both.
	 **/
	stripScripts: function(str) {
		return str.replace(/<script[^>]*>[\S\s]*?<\/script>/img, '');
	}
};

