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

/*global exports, Future, PalmCall, console */
/**
 * DB class mockup that emulates the real DB and implements most of its functionality and methods. Will use the same query syntax as db8.
 * @class DB
 * @module foundations
 */
var sys = require('sys');
var path = require('path');
var fs = require('fs');

sys.puts("Loading db mock module ..");

var DB = exports.Data.DB = global.DB = {
	_revision : 0,

	/**
	 * Parse a JSON string to return an object representation of a string passed as parameter or the parameter itself in case it was other type than string
	 * @method parseJSON
	 * @param {string} _query
	 * @return {Object} the Object representation the string
	 */
	parseJSON : function(_query) {
		return ( typeof (_query) === 'string' ? JSON.parse(_query) : _query );
	},
	/**
	 * Lookup the query results in user defined space (global['dbMockup'])
	 * @method lookupResult
	 * @param {string} type
	 * @param {string} test
	 * @return {string|Object} the result of the query
	 */
	lookupResult : function(type, test) {
		var ttest;

		try {
			if( typeof (global) !== 'undefined' && typeof (global['dbMockup']) !== 'undefined' && typeof (global['dbMockup'][type]) !== 'undefined') {
				ttest = global['dbMockup'][type];
				for(var i = 0; i < ttest.length; i++) {
					if(ttest[i].test.indexOf(test) !== -1) {
						return ttest[i].result;
					}
				}
			}
		} catch(excepter) {
			console.error('Something went wrong in db.lookupResults ' + JSON.stringify(excepter));
		}

		return null;
	},
	/**
	 * Gets a collection of items that have the ids provided as parameter
	 * @method get
	 * @param {Array} ids The array of ids that are being searched for
	 * @return {string|Object} the result of the query
	 */
	get : function(ids) {
		ids = this.parseJSON(ids);
		if(ids.length === 0) {
			return new Future({
				returnValue : true,
				results : []
			});
		} else {
			return this.execute("get", {
				ids : ids
			});
		}
	},
	/**
	 * Puts in the database a collection of objects
	 * @method put
	 * @param {Array} objects The array of objects that are being put inside the database
	 * @return {string|Object} the result of the query
	 */
	put : function(objects) {
		objects = this.parseJSON(objects);
		if(objects.length === 0) {
			return new Future({
				returnValue : true,
				results : []
			});
		} else {
			DB._revision++;
			return this.execute("put", {
				objects : objects
			});
		}
	},
	/**
	 * Search for records in the database using a query
	 * @method find
	 * @param {Object} query The query that is used in the search process
	 * @param {Boolean} watch Currently not used
	 * @param {Number} count The number of results that will be returned by the query
	 * @return {Object} the result of the query
	 */
	find : function(query, watch, count) {
		query = this.parseJSON(query);
		return this.execute("find", {
			query : query,
			watch : watch,
			count : count
		});
	},
	/**
	 * Delete a set of records by sending an array of ids or a query object
	 * @method del
	 * @param {Object} idsOrQuery The array of ids or query that is used in the delete process
	 * @param {Boolean} purge a flag that specifies if the table will be purged of the deleted items
	 * @return {Object}
	 */
	del : function(idsOrQuery, purge) {
		var arg;
		idsOrQuery = this.parseJSON(idsOrQuery);
		if(Object.prototype.toString.call(idsOrQuery) == "[object Array]") {
			if(idsOrQuery.length === 0) {
				return new Future({
					returnValue : true,
					results : []
				});
			} else {
				arg = {
					ids : idsOrQuery
				};
			}
		} else {
			arg = {
				query : idsOrQuery,
				purge : (!!purge)
			};
		}
		return this.execute("del", arg);
	},
	/**
	 * Merges the objects or the result of the query with the given properties map
	 * @method merge
	 * @param {Array} objectsOrQuery The array of objects or the query that are being merged
	 * @param {Array} properties The array map of properties that will be merged with the objects
	 * @return {string|Object} the result of the query
	 */
	merge : function(objectsOrQuery, properties) {
		var arg;
		objectsOrQuery = this.parseJSON(objectsOrQuery);

		if(Object.prototype.toString.call(objectsOrQuery) == "[object Array]") {
			if(objectsOrQuery.length === 0) {
				return new Future({
					returnValue : true,
					results : []
				});
			} else {
				arg = {
					objects : objectsOrQuery
				};
			}
		} else {
			arg = {
				query : objectsOrQuery,
				props : properties
			};
		}

		return this.execute("merge", arg);
	},
	/**
	 * Reserves a number of ids in the database
	 * @method reserveIds
	 * @param {Number} count The number of the ids that must be reserved
	 * @return {string|Object} the result of the operation that contains the number of the reserved ids
	 */
	reserveIds : function(count) {
		if(count === 0) {
			return new Future({
				returnValue : true,
				ids : []
			});
		} else {
			return this.execute("reserveIds", {
				count : count
			});
		}
	},
	/**
	 * Initializes the kinds and subkinds and sets the relations with subkinds
	 * @method setKindArray
	 * @param {String} _id the id of the master kind
	 * @param {Array} _kinds The array of kinds that will be set
	 */
	setKindArray: function(_id, _kinds) {
		var recs = this.getDbStore();
		this._kinds[_id] = _kinds;
		recs[_id] = [];
		var nbKinds = _kinds.length;
		for (var i=0;i<nbKinds;i++) {
			recs[_kinds[i]] = [];
		}
	},
	/**
	 * Add a kind to the database
	 * @method doPutKind
	 * @param {object} _args - containing the id of the kind, and the extends array
	 * @return {object} results
	 **/
	doPutKind: function(_args) {
		var exts = _args.exts || [];
		var newExt = [];
		var kindsArray = this.getSubKinds(_args.id);
		if (!kindsArray) {
			kindsArray = [];
		}
		//console.log("kindsArray="+JSON.stringify(kindsArray))
		var nbExt = exts.length;
		for (var i=0;i<nbExt;i++) {
			var found = false;
			var nbKinds = kindsArray.length;
			for (var j=0;j<nbKinds;j++) {
				found = kindsArray[j] === exts[i];
				if (found)
					break; 
			}
			if (!found) {
				newExt.push(exts[i])
			}
		}
		var recs = this.getDbStore();
		//console.log("newExt="+JSON.stringify(newExt))
		//console.log("recs="+JSON.stringify(recs))
		this.setKindArray(_args.id, kindsArray.concat(newExt));
		//console.log("kinds="+JSON.stringify(this._kinds))
		//console.log("recs2="+JSON.stringify(recs))
		return newExt;
	},
	/**
	 * Adds a kind to kind array
	 * @method putKind
	 * @param _id the id of the kind
	 * @param _owner not used
	 * @param _syntax not used
	 * @param _sync not used
	 * @param _extends an array with the subkinds of this kind
	 * @param _indexes not used
	 * @param _revSets not used
	 * @return result of the operation
	 */
	putKind : function(_id, _owner, _syntax, _sync, _extends, _indexes, _revSets) {
		var exts = _extends;
		if (typeof exts === "string")
			exts = [exts];
		//console.log("Put kind for id=" + _id)
		return this.execute("putKind", {
			"id" : _id,
			"exts" : exts
		});
	},
	
	/**
	 * Delete a kind from _kinds array
	 * @method delKind
	 * @param _id the id of the kind to be deleted
	 * @return result of deletion
	 */
	delKind : function(_id) {
		return this.execute("delKind", {
			"id" : _id
		});
	},
	/**
	 * Sets the initial revision in the database
	 * @method setInitalRevision
	 * @param {String} _revision the revision string that will be set on the database
	 */
	setInitalRevision : function(_revision) {
		DB._revision = _revision;
	},
	/**
	 * Execute a query
	 * @method execute
	 * @param {string} cmd
	 * @param {Array} args
	 * @return {Object} the result of the query
	 */
	execute : function(cmd, args) {
		try {
			//console.log('Got a new command db to execute: ' + cmd);
			switch(cmd) {
				case 'put' :
					return this.formatResult(this.doPut(args.objects))
					break;
				case 'del':
					if(args.query.query)
						args.query = args.query.query;
					//console.log(JSON.stringify(args))
					var purge = args.purge || false;
					if(args.query.ids) {
						//console.log(JSON.stringify(args))
						return this.formatResult(this.doDelete(null, args.query.ids, "ids", purge));
					} else if(args.query) {
						return this.formatResult(this.doDelete(args.query.from, args.query.where, "query", purge));
					}
					break;
				case 'find' :
					var lookup = this.lookupResult(cmd, JSON.stringify(args['query']));
					if(lookup) {
						return this.formatResult(lookup);
					} else {
						if(args.query.query)
							args.query = args.query.query;
						return this.formatResult(this.doFind(args.query.from, args.query));
					}
					break;
				case 'reserveIds' :
					return new Future({
						returnValue : true,
						ids : this.doReserveIds(args['count'])
					});
					break;
				case 'merge' :
					return this.formatResult(this.doMerge(args));
					break;
				case 'delKind':
					return this.formatResult(this.doDelKind(args));
					break;
				case 'putKind':
					return this.formatResult(this.doPutKind(args));
					return 
				break;
			}
		} catch(except) {
			console.log('DB execute exception: ' + JSON.stringify(except));
		}

		return new Future({
			returnValue : true,
			results : this.lookupResult(cmd, JSON.stringify(args['query']))
		});
	},
	/**
	 * Format the result of the queries
	 * @method formatResult
	 * @param {object} _result
	 * @return {Future} - a new Future with the query results
	 */
	formatResult : function(_result) {
		return new Future({
			returnValue : true,
			results : _result
		});
	},
	/**
	 * Get the db store obuject. Thsi will be the object which holds the table informations and data. There will be 2 stores: one for normal
	 * db and the other for the temporary db
	 * @method getDbStore
	 * @return {object}
	 */
	getDbStore : function() {
		var recs = DB._records;
		if(this.temp)
			recs = DB._tempRecords;

		return recs;
	},
	/**
	 * Clear the DB from all the records and all stored kinds.
	 * @method clearDB
	 * @return {object}
	 */
	clearDB : function() {
		DB._records = {};
		DB._tempRecords = {};
		DB._kinds = {};
	},
	/**
	 * Get a list of all the table from the current datastore. Will be used for a full database search by id
	 *
	 * @method getKinds
	 * @return {array}
	 */
	getKinds : function() {
		var recs = this.getDbStore(), rkeys = [];

		for(var key in recs) {
			rkeys.push(key);
		}

		return rkeys;
	},
	/**
	 * Get a db table - willr eturn the records form a table or init the table if it does not exist and return
	 * and empty set of records. _table is the table's name
	 * @method getTable
	 * @param {string} _table
	 * @return {object} the records from a table
	 */
	getTable : function(_table) {
		var recs = this.getDbStore();		

		if(!recs[_table])
			recs[_table] = [];		
		
		return recs[_table];
	},
	/**
	 * Set a db table - will return the records form a table or init the table if it does not exist and return
	 * and empty set of records. _table is the table's name
	 * @method setTable
	 * @param {string} _table
	 * @param {array} _data
	 * @return {boolean} return the success state of seting the table
	 */
	setTable : function(_table, _data) {
		var recs = this.getDbStore();
		if(!recs[_table]) {
			recs[_table] = [];
		}
		try {
			recs[_table] = _data;
			return true;
		} catch(exception) {
			return false;
		}
	},
	/**
	 * Generate a unique id for a record. The unique id will be made out of the current time and some random string
	 * @method generateUniqueId
	 * @return {String}
	 */
	generateUniqueId : function() {
		/*
		 * Generate a random number based on a specified range
		 */
		function getRandomNumber(range) {
			return Math.floor(Math.random() * range);
		}

		/*
		 * Get a random character based on getRandomNumber declared above
		 */
		function randomChar() {
			var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
			return chars.substr(getRandomNumber(62), 1);
		}

		var unique = new Date().getTime() + "+";
		for(var i = 0; i < 5; i++) {
			unique += randomChar();
		}

		return unique;
	},
	/**
	 * Store an object in the fake db. The object will be a db8 type record. Will return an object made out of
	 * the stored id and the revision number. The revision number will be incremented by every method call
	 *
	 * @method putObject
	 * @param {object} _object
	 * @return {object}
	 */
	putObject : function(_object) {
		_object._id = _object._id || this.generateUniqueId();
		_object._rev = DB._revision;
		
		// get the table where the object will eb stored. The table name is the record's kind name
		table = this.getTable(_object._kind);
		table.push(_object);
		DB._revision++;
		return {
			"id" : _object._id,
			"rev" : _object._rev
		}
	},
	/**
	 * Store objects in the fake id. Will call putobject to store a record from the collection. Will return am
	 * array of objects consisting of the object id and revision number
	 *
	 * @method doPut
	 * @param {object} _objects
	 * @return {object}
	 */
	doPut : function(_objects) {
		var i, len, object, table, response = [];
		len = _objects.length;
		try {
			// If we are storing only one object
			if( typeof (len) === 'undefined') {
				response.push(this.putObject(_objects));
			}
			//else store all the objects from the array
			for( i = 0; i < len; i++) {
				response.push(this.putObject(_objects[i]));
			}
		} catch(exc) {
			console.log(JSON.stringify(exc));
			return [];
		}

		return response;
	},
	/**
	 * Delete an object from the database.
	 *
	 * @method deleteObject
	 * @param {object} _object
	 * @param {boolean} _purge
	 * @return {object}
	 */

	deleteObject : function(_object, _purge) {
		var result = {};

		if(_purge) {
			//console.log("doDelete " + JSON.stringify(_object))
			_object._purge = true;
			result = {
				"id" : _object._id
			};
		} else {
			_object._rev = DB._revision;
			_object._del = true;

			DB._revision++;
			result = {
				"id" : _object._id,
				"rev" : _object._rev
			};
		}

		return result;
	},
	/**
	 * Delete record(s) from the database. Will return the number or deleted records
	 * @todo At this moment the records are not deleted from the table. Implement the real world deleting
	 *
	 * @method doDelete
	 * @param {String} _from
	 * @param {Array} _where
	 * @param {String} _type
	 * @param {Boolean} _purge
	 * @return {Object}
	 */

	doDelete : function(_from, _where, _type, _purge) {
		var table, counter = 0, results, result = {}, obj;
		if(_from) {
			table = this.getTable(_from);
		}

		switch(_type) {
			case "ids":
				//console.log(JSON.stringify("where"+_where))
				results = this.getRecordsById(_where);
				//console.log(JSON.stringify(results))

				result.results = [];
				var nbRes = results.length;
				for(var i = 0; i < nbRes; i++) {
					obj = results[i];
					//console.log(JSON.stringify(_purge))
					result.results.push(this.deleteObject(obj, _purge));
				}
				break;
			case "query":
				results = this.filterQueries(table, _where, 'del');

				var nbRes = results.length;
				for(var i = 0; i < nbRes; i++) {
					obj = table[results[i]];
					this.deleteObject(obj, _purge);
				}
				if(results === "*")
					counter = table.length;
				else
					counter = results.length;
				result = {
					count : counter
				};
				break;
		}

		if(_purge) {
			if(table) {
				//console.log(JSON.stringify(table))
				var nbRecs = table.length, newTable = [];
				for(var i = 0; i < nbRecs; i++) {
					if(!table[i]._purge) {
						newTable.push(table[i]);
					}
				}
				this.setTable(_from, newTable);
			} else {
				var kinds = this.getKinds();
				var nbKinds = kinds.length;
				for(var i = 0; i < nbKinds; i++) {
					table = this.getTable(kinds[i]);
					//console.log(JSON.stringify(table))
					var nbRecs = table.length, newTable = [];
					for(var j = 0; j < nbRecs; j++) {
						if(!table[j]._purge) {
							newTable.push(table[j]);
						}
					}
					table = newTable;
					this.setTable(kinds[i], table);
				}
				//console.log(JSON.stringify(table))
			}
		}

		return result;
	},
	/**
	 * Sort the results by a given sort member
	 *
	 * @method sortResult
	 * @param {object} _results
	 * @param {string] _sortBy
	 * @param {string} _sortType
	 * @return {object} - sorted result set
	 */
	sortResult : function(_results, _sortBy, _sortType) {
		var sortType = _sortType || "asc";

		// Check to see if the string is a date and if so parse it and return timestamp, else return null

		function parseDate(_date) {
			var datePat = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/;
			var matchArray = _date.match(datePat), year, month, day, d;
			if(matchArray != null) {
				year = matchArray[1];
				// p@rse date into variables
				month = matchArray[3];
				day = matchArray[5];
				d = new Date();
				d.setMonth(month);
				d.setDate(day);
				d.setYear(year);

				return d.getTime();
			} else {
				return null;
			}
		}

		// compare two dates ( will check if the two strings are dates or not)
		function compareDates(_date1, _date2, _stype) {
			var d1 = parseDate(_date1), d2 = parseDate(_date2), stype = _stype || "asc";

			if(d1 === null || d2 === null) {
				return null;
			} else {
				if(stype === 'asc') {
					return d1 - d2;
				} else {
					return d2 - d1;
				}
			}
		}

		function doSort(a, b) {
			var s1 = a[_sortBy], s2 = b[_sortBy], compare;

			if( typeof (s1) === 'string' && typeof (s2) == 'string') {
				compare = compareDates(s1, s2, sortType);
				if(compare !== null)
					return compare;
			}

			if(sortType === 'asc') {
				return (a[_sortBy] - b[_sortBy])
			} else {
				return (b[_sortBy] - a[_sortBy]);
			}
		}

		return _results.sort(doSort);
	},
	/**
	 * Find record(s) in the fake database. Will return an array of all the records found in the database. _args may contain the following:
	 * 			- select: not implemented
	 * 			- from: from which table are we going to retrieve results ( result kind )
	 * 			- where: an array of prop, op, val attributes
	 * 			- orderBy: not implemented
	 * 			- desc: descending order - not implemented
	 * 			- incDel: include deleted records - implemented
	 * 			- limit: the number of records to return, default all
	 * 			- page: the page key - it is implemented only for integer values
	 *
	 * TODO - check to see if the not implemented operators should be implemented or we can live without them :D
	 * @method doFind
	 * @param {string} _from
	 * @param {object} _args
	 * @return {array}
	 */
	doFind : function(_from, _args) {
		var table = this.getTable(_from), 
			counter, 
			records, 
			page, 
			limit, 
			highlimit, 
			lowlimit, 
			incDel = ( typeof (_args.incDel) !== 'undefined' ? _args.incDel : true), 
			orderBy = _args.orderBy || null,
			subKinds = this.getSubKinds(_from),
			nbSubKinds = subKinds.length;
		
		for (var i=0;i<nbSubKinds;i++) {
			table = table.concat(this.getTable(subKinds[i]));
		}

		if(table) {
			records = this.filterQueries(table, _args.where || [], 'find', incDel);
			if(orderBy !== null) {
				records = this.sortResult(records, orderBy);
			}
			if(_args.limit) {
				limit = _args.limit;
				page = parseInt(_args.page || 0) || 0;
				lowlimit = page * limit;
				highlimit = limit + lowlimit;

				if(records.length < lowlimit) {
					return [];
				} else if(records.length < highlimit) {
					return records.slice(lowlimit, records.length);
				} else {
					return records.slice(lowlimit, highlimit);
				}
			} else
				return records;
		}

		return [];
	},
	/**
	 * Check the field's value inside an array specified in _value
	 * @method compareArrayFields
	 * @param {variant} _field
	 * @param {string} _operator
	 * @param {variant} _value
	 * @return {boolean}
	 */
	compareArrayFields : function(_field, _operator, _value) {
		var i, len;

		for(var i = 0; i < _value.length; i++) {
			if(this.compareFields(_field, _operator, _value[i])) {
				return true;
			}
		}

		return false;
	},
	/**
	 * Compare the field value with the val value from the where clause, depending on the type of the operator
	 * requested. Will return true if the condition is fulfilled
	 *
	 * @method compareFields
	 * @param {variant} _field
	 * @param {string} _operator
	 * @param {variant} _value
	 * @return {boolean}
	 */
	compareFields : function(_field, _operator, _value) {
		var isCorrect = false;

		if( typeof (_value) === 'object' && _value.length) {
			return this.compareArrayFields(_field, _operator, _value);
		}

		switch(_operator) {
			case "<" :
				isCorrect = (_field < _value);
				break;
			case "<=":
				isCorrect = (_field <= _value);
				break;
			case "=" :
				isCorrect = (_field == _value);
				break;
			case ">=":
				isCorrect = (_field >= _value);
				break;
			case ">" :
				isCorrect = (_field > _value);
				break;
			case "!=":
				isCorrect = (_field != _value);
				break;
			case "?" :
				isCorrect = (_field.indexOf(_value) != -1);
				break;
			case "%" :
				isCorrect = (_field.indexOf(_value) != -1);
				break;
		}

		return isCorrect;
	},
	/**
	 * Check to see if the record matches the where condition(s) (if any). Will check the record against all the
	 * consitions from the where array. If one condition is falsy then the record does not match the where
	 * statement
	 *
	 * @method isValidQuery
	 * @param {object} _record
	 * @param {array} _where
	 * @return {boolean}
	 */
	isValidQuery : function(_record, _where, _incDel) {
		try {
			// If the record is stored as string then convert it to js object
			var record = ( typeof (_record) === 'string' ? JSON.parse(_record) : _record ), i, len, where, isValid = true, op, incDel, isDeleted = _record["_del"] || false;
			incDel = ( typeof (_incDel) !== 'undefined' ? _incDel : true);
			if(!incDel && isDeleted)
				return false;
			len = _where.length;
			for( i = 0; i < len; i++) {
				where = _where[i];
				/*
				 * if one of the attributes defined in the where clause cannot be retrieved from the current
				 * record then the whole checking is falsy
				 */
				if( typeof (_record[where.prop]) !== 'undefined') {
					if(!this.compareFields(record[where.prop], where.op, where.val))
						return false;
				} else
					return false;
			}
		} catch(except) {
			console.log('Exception caught in DB.isValidQuery: ' + JSON.stringify(except));
			return false;
		}

		return true;
	},
	/**
	 * Filter the queires based on the where clause. If it is called from the find command then will return all
	 * the matched records. If it is called from delete command then will return all the records that need to be
	 * deleted.
	 *
	 * @method filterQueries
	 * @param {array} _queries
	 * @param {array} _where
	 * @param {string} _cmd
	 * @return {array}
	 */
	filterQueries : function(_queries, _where, _cmd, _incDel) {
		try {
			var i, len, query, results = [], incDel;
			incDel = ( typeof (_incDel) !== 'undefined' ? _incDel : true);
			if(_where.length === 0) {
				if(_cmd === 'find') {
					return _queries;
				} else if(_cmd === 'del') {
					return '*';
				}
			}
			len = _queries.length;
			for( i = 0; i < len; i++) {
				query = _queries[i];
				if(this.isValidQuery(_queries[i], _where, incDel)) {
					if(_cmd === 'find') {
						_queries[i].dbposition = i;
						results.push(_queries[i]);
					} else if(_cmd == 'del') {
						results.push(i);
					}
				}
			}
		} catch(except) {
			console.error("Error in filterQueries: " + JSON.stringify(except));
			return [];
		}

		//console.log('Returning ' + results.length + ' result(s)');
		return results;
	},
	/**
	 * Reserve ids for some queries. The number of reserved ids is given by _count
	 * @method doReserveIds
	 * @param {int} _count
	 * @return {array}
	 */
	doReserveIds : function(_count) {
		var c = DB._revision, results = [], i;

		for( i = 0; i < _count; i++) {
			results.push((i + 1 + c));
		}

		return results;
	},
	/**
	 * Merge two json objects
	 *
	 * @method mergeObjects
	 * @param {object} objdest
	 * @param {object} objsource
	 * @return {obejct}
	 */
	mergeObjects : function() {
		var a = arguments, key, objdest = a[0] || {}, objsource = a[1] || {};

		for(key in objsource ) {
			if(key != '_kind')
				objdest[key] = objsource[key];
		}

		return objdest;
	},
	/**
	 * Merge two arrays
	 *
	 * @method mergeArray
	 * @param {array} ar1
	 * @param {array} ar2
	 * @return {array} result
	 */
	mergeArrays : function() {
		var a = arguments, i, len, ar1 = a[0] || [], ar2 = a[1] || [], len = ar2.length;

		for( i = 0; i < len; i++) {
			ar1.push(ar2[i]);
		}

		return ar1;
	},
	/**
	 * Get results by the given id
	 *
	 * @method getRecordsById
	 * @param {array} _ids
	 * @param {boolean} _incDel
	 * @return {array}
	 */
	getRecordsById : function(_ids, _incDel) {
		var ids = _ids || [], incDel;
		incDel = ( typeof (_incDel) !== 'undefined' ? _incDel : true);
		return this.getRecordsBy(ids, '_id', incDel);
	},
	/**
	 * Get a list of records by one of the properties ( for example by _id )
	 *
	 * @method getRecordsBy
	 * @param {array} _ids
	 * @param {string} _props
	 * @param {boolean} _incDel
	 * @return {array}
	 */
	getRecordsBy : function(_ids, _props, _incDel) {
		var recs = this.getKinds() || [], i, len = recs.length, table, results, ids = _ids || [], incDel, returnResults = [], props = _props || "_id";
		incDel = ( typeof (_incDel) !== 'undefined' ? _incDel : true);
		for(var i = 0; i < recs.length; i++) {
			table = this.getTable(recs[i]);
			results = this.filterQueries(table, [{
				"prop" : props,
				"op" : "=",
				"val" : ids
			}], 'find');
			if(results.length > 0) {
				returnResults = this.mergeArrays(returnResults, results);
			}
		}

		return returnResults;
	},
	/**
	 * Get an object containing at least an id, will search for all the records matching that id and will overwrite the found records with the
	 * new values
	 *
	 * @method mergeData
	 * @param {object} _object
	 * @return {array} results
	 */
	mergeData : function(_object) {
		var toReturn = [], j, lenj, results, table, result, object = _object || {};
		results = this.getRecordsById([object["_id"]]);
		if(results.length > 0) {
			lenj = results.length;
			for( j = 0; j < lenj; j++) {
				result = results[j];
				result = this.mergeObjects(result, object);

				if(result["_kind"]) {
					table = this.getTable(result["_kind"]);
					if( typeof (result['dbposition']) !== 'undefined') {
						DB._revision++;
						result.rev = DB._revision;
						toReturn.push(result);
						table[result['dbposition']] = result;
					}
				}
			}
		}

		return toReturn;
	},
	/**
	 * Merge some objects from the db with some objects given ( similar to update from db )
	 *
	 * @method doMergeObjects
	 * @param {array} _objects
	 */
	doMergeObjects : function(_objects, _props) {
		var i, len = _objects.length, object, results = [], toReturn = [], props = _props || null;

		for( i = 0; i < len; i++) {
			object = _objects[i];
			if(object["_id"]) {
				// in case we have some properties defined overwrite the main object's properties with the new values and continue the normal
				// flow as in case of object merge
				if(props !== null)
					object = this.mergeObjects(object, props);
				results = this.mergeData(object);
				toReturn = this.mergeArrays(toReturn, results);
			}
		}

		return toReturn;
	},
	/**
	 * Merge objects taken from a query's result. _args parameter is a db8 merge query for example:
	 * 				{"props":{"birthday":null, "isty" : "was here"},"query":{"from":"com.palm.contact.facebook:1","where":[]}}
	 * Where:
	 * 			- props os an object of properties to be overwritten
	 * 			- query is an object made out of :
	 * 						- from - the kind from where we are retrieving data
	 * 						- where - the filters for results
	 *
	 * @method doMergeQuery
	 * @param {object} _args
	 */
	doMergeQuery : function(_args) {
		var query = _args.query || _args, from = query.from || "", where = query.where || [], props = _args.props || null, objects;

		// run the query and retrieve the results
		objects = this.doFind(from, query);
		// merge the retrieved objects
		return this.doMergeObjects(objects, props);
	},
	/**
	 * Merge data in the database
	 *
	 * @method doMerge
	 * @param {object} _args
	 * @return {object} results
	 */
	doMerge : function(_args) {
		if(_args.objects) {
			return this.doMergeObjects(_args.objects);
		} else if(_args.query) {
			if(_args.query.objects) {
				return this.doMergeObjects(_args.query.objects);
			} else {
				return this.doMergeQuery(_args);
			}
		}
	},
	/**
	 * Delete a kind from the database. The delete of the kind deletes the records associated to the kind aswell.
	 * @method doDelKind
	 * @param {object} _args - containing the id of the kind to delete
	 * return {object} results
	 **/
	doDelKind : function(_args) {
		var id = _args.id, recs = this.getDbStore();
		var subKinds = this.getSubKinds(id),
		nbSubKinds = subKinds.length;
		//console.log("del recs=" + JSON.stringify(recs))
		//console.log("del kinds=" + JSON.stringify(this._kinds))
		try {			
			delete recs[id];			
			for (var i=0;i<nbSubKinds;i++) {
				delete recs[subKinds[i]];
			}
			delete this._kinds[id];			
		} catch(exc) {
		}
		//console.log("del kinds=" + JSON.stringify(this._kinds))
		//console.log("del recs=" + JSON.stringify(recs))
		return subKinds.concat([id]);
	},
	/**
	 * get subkinds for an id
	 * @method getSubKinds
	 * @param {string} _id
	 * return {array} subkinds found
	 */
	getSubKinds: function getSubKinds(_id) {
		if (!_id)
			return [];
		
		return this._kinds[_id] || [];
	}
};

/*
 * Main record storage
 */
DB._records = {};
/*
 * Temporary record storage
 */
DB._tempRecords = {};
/*
 * Kinds storage
 */
DB._kinds = {};

var tempDBFactory = function() {
	this.temp = true;
};
tempDBFactory.prototype = DB;

var TempDB = global["tempDB"] = new tempDBFactory();

var TempDB = exports.Data.TempDB = global.tempDB = new tempDBFactory();