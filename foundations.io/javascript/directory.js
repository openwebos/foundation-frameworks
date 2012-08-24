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

var Directory = exports.Directory =
{
	getFiles: function(path, pattern, options)
	{
		return new Future().now(function(future)
		{
			var FTS = webOS.FTS;
			var fts = new FTS(path, FTS.FTS_LOGICAL | FTS.FTS_NOSTAT);
			try
			{
				if (!fts.read())
				{
					throw new DirectoryNotFoundError(path);
				}
				var files = [];
				for (;;)
				{
					var file = fts.read();
					//if (file) for (var k in file) console.log(k, file[k]);
					if (!file)
					{
						break;
					}
					var dot = (file.name[0] === ".");
					if (file.directory && (options === SearchOptions.top || dot))
					{
						fts.set(FTS.FTS_SKIP);
					}
					if (!file.postorderDirectory && !dot && (!pattern || pattern.test(file.name)))
					{
						if (file.directory)
						{
							file.path += "/";
						}
						files.push(file.path);
					}
				}
				future.result = files;
			}
			finally
			{
				fts.close();
			}
		});
	}
};
