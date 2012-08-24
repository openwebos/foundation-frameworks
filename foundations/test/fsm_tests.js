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

/*global Foundations, UnitTest */
function FSMTests() {
	this.states = {
		one: {
			gotoTwo: function() {
				return "two";
			},
			gotoThree: function() {
				return "three";
			}
		},
		two: {
			gotoOne: function() {
				return "one";
			},
			gotoThree: function() {
				return "three";
			}
		},
		three: {
			gotoTwo: function() {
				return "two";
			},
			gotoOne: function() {
				return "one";
			}
		}
	};
}

FSMTests.prototype = {
	testMixIn: function(reportResult) {
		var context = {};
		var fsm = new Foundations.Control.FSM(this.states, context);
		UnitTest.requireEqual(Object.keys(context).length, 2);
		return UnitTest.passed;
	},
	testStateTransitions: function(reportResult) {
		var context = {};
		var fsm = new Foundations.Control.FSM(this.states, context);
		UnitTest.requireEqual(fsm.currentState(), "__uninitialized");
		fsm.go("two");
		UnitTest.requireEqual(fsm.currentState(), "two");
		return UnitTest.passed;
	},
	testStateEvents: function(reportResult) {
		return UnitTest.passed;
	}
};