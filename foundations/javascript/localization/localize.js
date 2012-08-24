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

var defaultLocale;

var create$L = exports.Localization.create$L = function(root, locale)
{
	var strings = readStringTable(locale ? makeLocale(locale) : defaultLocale, root + "resources", "strings.json");
	return function(stringToLocalize)
	{
		return strings[stringToLocalize] || stringToLocalize;
	}
}

function readStringTable(locale, path, filename) 
{
	function readResources(subdir)
	{
		try
		{
			return JSON.parse(palmGetResource(path + "/" + subdir + "/" + filename));
		}
		catch (_)
		{
			return undefined;
		}
	}
	
	// We read strings in either LANGUAGE_REGION/ or LANGUAGE/ + LANGUAGE/REGION/
	var table = readResources(locale.base);
	if (!table)
	{
		table = readResources(locale.language) || {};
		var rtable = readResources(locale.region);
		for (var k in rtable)
		{
			table[k] = rtable[k];
		}
	}
	return table;
}

function makeLocale(locale)
{
	return {
		base: locale,
		language: locale.slice(0, 2),
		region: locale.replace("_", "/")
	};
}

// Select the current locale
if (typeof document === "undefined" || typeof PalmSystem === "undefined")
{
	defaultLocale = makeLocale("en_us");
} else {
	defaultLocale = makeLocale(PalmSystem.locale);
}
