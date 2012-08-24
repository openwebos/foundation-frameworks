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

/*global Foundations, UnitTest, console */

function DBTests() {
	this.kind1 = "people:1";
	this.owner = "com.palm.foundations";
	this.DB = Foundations.Data.DB;
}
function TempDBTests() {
	this.kind1 = "temp-people:1";
	this.owner = "com.palm.foundations";
	 this.DB = Foundations.Data.TempDB;
}

TempDBTests.prototype = DBTests.prototype = {
	testPutKind: function(callback) {
		var indexes = [
			{"name":"name", props:[{"name": "name"}]},
			{"name":"profession", props:[{"name": "profession"}]}
		];
		this.DB.putKind(this.kind1, this.owner, indexes).then(function(future) {
			var result = future.result;
			//console.log("result:"+UnitTest.toJSON(result));
			callback(result.returnValue===true?UnitTest.passed:"putKind returned:"+UnitTest.toJSON(result));
		});
	},
	testPut: function(callback) {
		var r1 = {
			_kind: this.kind1,
			name: "TestName1",
			profession: "engineer"
		};
		var r2 = {
			_kind: this.kind1,
			name: "TestName2",
			profession: "trainer"
		};
		var objs = [r1,r2];
		this.DB.put(objs).then(function(future) {
			var result = future.result;
			//console.log("result:"+UnitTest.toJSON(result));
			for (var i=0; i< result.length; i++) {
				var r = result[i];
				if (!r.id && !r.rev){
					callback("r.id="+r.id+", r.rev="+r.rev);
					return;
				}
			}
			callback(UnitTest.passed);
		});
	},
	testPutNothing: function(callback) {
		var objs = [];
		this.DB.put(objs).then(function(future) {
			var result = future.result;
			//console.log("result:"+UnitTest.toJSON(result));
			if (result.results && result.results.length === 0) {
				callback(UnitTest.passed);
			} else {
				callback(UnitTest.failed);
			}
		});
	},
	testGet: function(callback) {
		var r1 = {
			_kind: this.kind1,
			name: "TestName3",
			profession: "engineer"
		};
		var id;
		this.DB.put([r1]).then(this, function(future) {
			var result = future.result.results;
			id = result[0].id;
			//console.log("inserted id="+id);
			future.result=id;
		}).then(this, function(future) {
			id = future.result;
			//console.log("retreiving "+id);
			future.nest(this.DB.get([id]));
		}).then(this, function(future) {
			var record = future.result.results[0];
			//console.log("record="+JSON.stringify(record));
			if (id === record._id) {
				callback(UnitTest.passed);
			} else {
				callback("ids don't match. id="+id+", _id="+record._id);
			}
		});
	},
	testGetNothing: function(callback) {
		this.DB.get([]).then(function(future) {
			var result = future.result;
			//console.log("result:"+UnitTest.toJSON(result));
			if (result.results && result.results.length === 0) {
				callback(UnitTest.passed);
			} else {
				callback(UnitTest.failed);
			}
		});
	},
	testDel: function(callback) {
		var r1 = {
			_kind: this.kind1,
			name: "TestName4",
			profession: "engineer"
		};
		var id;
		this.DB.put([r1]).then(function(future) {
			var result = future.result.results;
			id = result[0].id;
			//console.log("inserted id="+id);
			future.result=id;
		}).then(this, function(future) {
			id = future.result;
			//console.log("deleting "+id);
			future.nest(this.DB.del([id]));
		}).then(function(future) {
			var record = future.result.results[0];
			//console.log("record="+JSON.stringify(record));
			if (id === record.id) {
				callback(UnitTest.passed);
			} else {
				callback("ids don't match. id="+id+", _id="+record._id);
			}
		});
	},
	testDelNothing: function(callback) {
		this.DB.del([]).then(function(future) {
			var result = future.result;
			//console.log("result:"+UnitTest.toJSON(result));
			if (result.results && result.results.length === 0) {
				callback(UnitTest.passed);
			} else {
				callback(UnitTest.failed);
			}
		});
	},
	testMerge: function(callback) {
		var r1 = {
			_kind: this.kind1,
			name: "TestName5",
			profession: "Engineer"
		};
		var id;
		this.DB.put([r1]).then(function(future) {
			var result = future.result.results;
			id = result[0].id;
			//console.log("inserted id="+id);
			future.result=id;
		}).then(this, function(future) {
			id = future.result;
			//console.log("merging to id "+id);
			future.nest(this.DB.merge([{_id: id, "profession":"Stonecutter"}]));
		}).then(this, function(future) {
			var record = future.result.results[0];
			//console.log("record="+JSON.stringify(record));
			if (id !== record.id) {
				callback("ids don't match. id="+id+", _id="+record.id);
			}
			future.nest(this.DB.get([id]));
		}).then(function(future) {
			var record = future.result.results[0];
			if (record.profession==="Stonecutter") {
				callback(UnitTest.passed);
			} else {
				callback("didn't merge! profession = "+record.profession);
			}
		});
	},
	testMergeNothing: function(callback) {
		this.DB.merge([]).then(function(future) {
			var results = future.result.results;
			if (results.length !== 0) {
				callback("Wrong number of results: "+results.length);
			} else {
				callback(UnitTest.passed);
			}
		});
	},
	_reserve_and_check: function(number, callback) {
		this.DB.reserveIds(number).then(function(f) {
			var ids=f.result.ids;
			if (ids.length != number) {
				callback("Mismatch! returned #ids "+ids.length+" doesn't match"+number);
			} else {
				callback(UnitTest.passed);
			}
		});
	},
	testReserveIDs: function(callback) {
		this._reserve_and_check(10, callback);
	},
	testReserveNoIDs: function(callback) {
		this._reserve_and_check(0, callback);
	}
};
