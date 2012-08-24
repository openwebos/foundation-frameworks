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

/*global exports:true */
exports.json2xml = function(json, options)
 {
	function escape(string) {
		string = string.replace(/&/g, "&amp;");
		string = string.replace(/</g, "&lt;");
		string = string.replace(/>/g, "&gt;");
		return string;
	}
	
    function convert(tag, obj)
    {
        tag = tag.replace("$", ":");
        var s = "<" + tag;
        var $t = undefined;
        var children = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                var v = obj[k];
                if (k == "$t")
                {
                    $t = escape(v);
                }
                else if (typeof v == "object")
                {
                    children.push({
                        tag: k,
                        val: v
                    });
                }
                else
                {
                    s += ' ' + k + '="' + v + '"';
                }
            }
        }
        if ($t === undefined && children.length === 0)
        {
            s += "/>";
        }
        else
        {
            if ($t !== undefined)
            {
                s += ">" + $t + "</" + tag + ">";
            }
            else
            {
                s += ">";
                var len = children.length;
                for (var i = 0; i < len; i++)
                {
                    var child = children[i];
                    var val = child.val;
                    if (Object.prototype.toString.call(val) == "[object Array]")
                    {

                        var vlen = val.length;
                        for (var j = 0; j < vlen; j++)
                        {
                            s += convert(child.tag, val[j]);
                        }
                    }
                    else
                    {
                        s += convert(child.tag, val);
                    }
                }
                s += "</" + tag + ">";
            }
        }
        return s;
    }

    options = options || {};
    var s = "";
    if (options.includeHeader)
    {
        s += "<?xml" + (json.version ? ' version="' + json.version + '"': '') + (json.encoding ? ' encoding="' + json.encoding + '"?>': "?>");
    }
    for (var k in json)
    {
        if (k != "version" && k != "encoding")
        {
            s += convert(k, json[k]);
        }
    }
    return s;
};
