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

var File = exports.File =
{
	open: function(path, mode)
	{
		return new FileStream(path, mode);
	},
	
	remove: function(path)
	{
		throw new Error("Not implemented");
	},
	
	move: function(frompath, topath)
	{
		throw new Error("Not implemented");
	},
	
	exists: function(path)
	{
		var FTS = webOS.FTS;
		var fts = new FTS(path, FTS.FTS_LOGICAL | FTS.FTS_NOSTAT);
		var r = fts.read();
		fts.close();
		return r ? r.errno === 0 : false;
	},
	
	copy: function(to, from)
	{
		var ffrom = File.open(from, "r");
		var fto = File.open(to, "w");
		return ffrom.copyTo(fto).then(function()
		{
			ffrom.close();
			fto.close();
			future.result = future.result;
		});
	},
}