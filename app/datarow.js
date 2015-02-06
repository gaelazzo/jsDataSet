/*global angular,ObjectObserver,_ */
/*jslint nomen: true*/

'use strict';
/**
 * DataRow shim, provides methods to treat objects as Ado.Net DataRows
 * @module DataSet
 * @submodule DataRow
 */


(function (isNode, isAngular) {

  var extLodash,
    extObjectObserver,
    dataRowFactory;

  if (typeof _ === 'undefined') {
    extLodash = require('lodash-node');
  } else {
    extLodash = _;
  }
  if (typeof ObjectObserver === 'undefined') {
    var ob = require('../../../../node_modules/observe-js/src/observe');
    extObjectObserver = ob.ObjectObserver
  } else {
    extObjectObserver = ObjectObserver;
  }


  dataRowFactory = function (dataRowVersion, $rowState) {
    var _ = extLodash,
      ObjectObserver = extObjectObserver;


    function isAngularField(f) {
      return (f.substr(0, 2) === '$$');
    }


    /**
     * Internal class attached to dataRow model data and used to track object changes
     * @private
     * @class DataRowObserver
     * @param {DataRow} d
     * @constructor
     */
    function DataRowObserver(d) {
      this.r = d;
    }

    DataRowObserver.prototype = {
      constructor: DataRowObserver,

      /**
       * Take track of object changes, managing added fields, removed fields, modified fields.
       * This is called automatically by the ObjectObserver attached to the object
       * @private
       * @method dataRowReactOnChange
       * @param added
       * @param removed
       * @param changed
       * @param getOldValueFn
       */
      dataRowReactOnChange: function (added, removed, changed, getOldValueFn) {
        if (this.r.state === $rowState.deleted || this.r.state === $rowState.added) {
          return;
        }
        var that = this;
        // respond to changes to the obj.
        Object.keys(added).forEach(function (property) {
          if (isAngularField(property)) {
            return;
          }
          if (that.r.removed.hasOwnProperty(property)) {
            //adding a property that was previously removed
            if (that.r.removed[property] !== added[property]) {
              //if the property had been removed with a different value, that values now goes into
              // old values
              that.r.old[property] = that.r.removed[property];
            }
            delete that.r.removed[property];
          } else {
            that.r.added[property] = added[property];
          }
        });

        Object.keys(removed).forEach(function (property) {
          if (isAngularField(property)) {
            return;
          }
//                property; // a property which has been been removed from obj
//                getOldValueFn(property); // its old value
          if (that.r.added.hasOwnProperty(property)) {
            delete that.r.added[property];
          } else {
            if (that.r.old.hasOwnProperty(property)) {
              //removing a property that had been previously modified
              that.r.removed[property] = that.r.old[property];
            } else {
              that.r.removed[property] = getOldValueFn(property);
            }
          }
        });

        Object.keys(changed).forEach(function (property) {
          if (isAngularField(property)) {
            return;
          }

          //if property is added, old values has not to be set
          if (!that.r.added.hasOwnProperty(property)) {
            if (!that.r.old.hasOwnProperty(property)) {
              that.r.old[property] = getOldValueFn(property);
            } else {
              if (that.r.old[property] === changed[property]) {
                delete that.r.old[property];
              }
            }
          }
          //property; // a property on obj which has changed value.
          //changed[property]; // its new value
          //getOldValueFn(property); // its old value
        });
      },
      toString: function () {
        return 'DataRowObserver on ' + this.r;
      }

    };

    /**
     * Provides methods to treat objects as Ado.Net DataRows
     * @class DataRow
     */


    /**
     * Creates a DataRow from a generic plain object, and returns the DataRow
     * @method DataRow
     * @param {object} o this is the main object managed by the application logic
     * @returns {DataRow}
     * @constructor
     */
    function DataRow(o) {

      if (o.constructor === DataRow) {
        throw 'Called  DataRow with a DataRow as input parameter';
      }

      if (o.getRow) {
        if (this && this.constructor === DataRow) {
          throw 'Called new DataRow with an object already attached to a DataRow';
        }
        return o.getRow();
      }

      if (this === undefined || this.constructor !== DataRow) {
        return new DataRow(o);
      }


      if (!o || typeof o !== 'object') {
        throw ('DataRow(o) needs an object as parameter');
      }

      /**
       * current value of the DataRow is the object o itself
       * @private
       * @property {object} current
       */
      this.current = o;
      /**
       * previous values of the DataRow, only previous values of changed fields are stored
       * @private
       * @property {object} old
       */
      this.old = {};

      /**
       * fields added to object (after last acceptChanges())
       * @private
       * @property {object} added
       */
      this.added = {};

      /**
       * fields removed (with delete o.field) from object (after last acceptChanges())
       * @private
       * @property {object} removed
       */
      this.removed = {};

      this.myState = $rowState.unchanged;
      var that = this,
        dObs;

      /**
       * State of the DataRow, possible values are added unchanged modified deleted detached
       * @property  state
       * @type {dataRowState}
       */
      Object.defineProperty(this, 'state', {
        get: function () {
          this.commit();
          if (that.myState === $rowState.modified || that.myState === $rowState.unchanged) {
            if (Object.keys(that.old).length === 0 &&
                Object.keys(that.added).length === 0 &&
                Object.keys(that.removed).length === 0) {
              that.myState = $rowState.unchanged;
            } else {
              that.myState = $rowState.modified;
            }
          }
          return that.myState;
        },
        set: function (value) {
          that.myState = value;
        },
        enumerable: false
      });


      /**
       * Get the DataRow attached to an object. This method is attached to the object itself,
       *  so you can get the DataRow calling o.getRow() where o is the plain object
       * @property {DataRow} getRow
       */
      Object.defineProperty(o, 'getRow', {
        value: function () {
          return that;
        },
        enumerable: false,
        configurable: true   //allows a successive deletion of this property
      });


      //Create an observer on this
      dObs = new DataRowObserver(this);
      this.observer = new ObjectObserver(this.current);
      this.observer.open(dObs.dataRowReactOnChange.bind(dObs));
    }

    DataRow.prototype = {
      constructor: DataRow,

      /**
       * get the value of a field of the object. If dataRowVer is omitted, it's equivalent to o.fieldName
       * @method getValue
       * @param {string} fieldName
       * @param {dataRowVersion} [dataRowVer='current'] possible values are 'original', 'current'
       * @returns {object}
       */
      getValue: function (fieldName, dataRowVer) {
        this.commit();
        if (dataRowVer === dataRowVersion.original){
          if (this.old.hasOwnProperty(fieldName)) {
            return this.old[fieldName];
          }
          if (this.removed.hasOwnProperty(fieldName)) {
            return this.removed[fieldName];
          }
          if (this.added.hasOwnProperty(fieldName)) {
            return undefined;
          }

        }
        return this.current[fieldName];
      },

      /**
       * Gets the original row, before changes was made, undefined if current state is added
       * @method originalRow
       * @return {object}
       */
      originalRow : function(){
        this.commit();
        if (this.state === $rowState.unchanged || this.state === $rowState.deleted){
          return this.current;
        }
        if (this.state === $rowState.added ) {
          return undefined;
        }

        var o = {},
          that = this;
        _.forEach(_.keys(this.removed), function (k){
          o[k]= that.removed[k];
        });
        _.forEach(_.keys(this.old), function (k) {
          o[k] = that.old[k];
        });
        _.forEach(_.keys(this.current), function(k){
          if (that.added.hasOwnProperty(k)){
            return; //not part of original row
          }
          if (that.old.hasOwnProperty(k)) {
            return; //not part of original row
          }
          o[k]= that.current[k];
        });
        return o;
      },

      /**
       * changes current row to make it's current values equal to another one. Deleted rows becomes modified
       * @method makeEqualTo
       * @param {object} o
       * @return {*}
       */
      makeEqualTo: function(o){
        var that = this;
        if (this.state === $rowState.deleted){
          this.rejectChanges();
        }
        //removes properties that are not present in o
        _.forEach(_.keys(this.current), function(k){
          if (!o.hasOwnProperty(k)){
            delete that.current[k];
          }
        });

        //get all properties from o
        _.forEach(_.keys(o), function(k){
          that.current[k] = o[k];
        });

        this.commit();
      },
      /**
       * changes current row to make it's current values equal to another one. Deleted rows becomes modified
       * @method patchTo
       * @param {object} o
       * @return {*}
       */
      patchTo: function (o) {
        var that = this;
        if (this.state === $rowState.deleted) {
          this.rejectChanges();
        }

        //get all properties from o
        _.forEach(_.keys(o), function (k) {
          that.current[k] = o[k];
        });

        this.commit();
      },
      /**
       * get changes from the ObjectObserver
       * @method commit
       * @private
       */
      commit: function () {
        if (this.observer) {
          this.observer.deliver();
        }
      },
      getModifiedFields: function(){
        return _.union(_.keys(this.old), _.keys(this.removed), _.keys(this.added));
      },

      /**
       * Makes changes permanents, discarding old values. state becomes unchanged.
       * @method acceptChanges
       */
      acceptChanges: function () {
        if (this.state === $rowState.detached) {
          return;
        }
        if (this.state === $rowState.deleted) {
          this.detach();
          return;
        }
        this.commit();
        this._reset();
      },

      /**
       * Discard changes, restoring the original values of the object. state becomes unchanged
       * @method rejectChanges
       */
      rejectChanges: function () {
        if (this.state === $rowState.detached) {
          return;
        }

        if (this.state === $rowState.added) {
          this.detach();
          return;
        }

        var fieldToDel,
          fieldToAdd;
        this.commit();
        _.extend(this.current, this.old);
        for (fieldToDel in this.added) {
          if (this.added.hasOwnProperty(fieldToDel)) {
            delete this.current[fieldToDel];
          }
        }
        for (fieldToAdd in this.removed) {
          if (this.removed.hasOwnProperty(fieldToAdd)) {
            this.current[fieldToAdd] = this.removed[fieldToAdd];
          }
        }
        this._reset();
      },

      /**
       * resets all change and sets state to unchanged
       * @private
       * @method _reset
       */
      _reset: function () {
        this.old = {};
        this.added = {};
        this.removed = {};
        this.state = $rowState.unchanged;
      },

      /**
       * Detaches row, loosing all changes made. object is also removed from the underlying DataTable
       * @method detach
       */
      detach: function () {
        this.state = $rowState.detached;
        if (this.observer) {
          this.observer.discardChanges();
          this.observer.close();
          delete this.observer;
        }
        if (this.table) {
          this.table.detach(this.current);
        }
        delete this.current.getRow;
      },

      /**
       * Deletes the row. If it is in added state it becomes detached. Otherwise any changes are lost, and
       *  only rejectChanges can bring the row into life again
       *  @method del
       */
      del: function () {
        if (this.state === $rowState.deleted) {
          return;
        }
        if (this.state === $rowState.added) {
          this.detach();
          return;
        }
        if (this.state === $rowState.detached) {
          return;
        }
        this.rejectChanges();
        this.state = $rowState.deleted;
      },

      /**
       * Debug - helper function
       * @returns {string}
       * @method toString
       */
      toString: function () {
        if (this.table) {
          return 'DataRow of table ' + this.table.name + ' (' + this.state + ')';
        }
        return 'DataRow' + ' (' + this.state + ')';
      },

      /**
       * Gets the parent(s) of this row in the dataSet it is contained, following the relation with the
       *  specified name
       * @method getParentRows
       * @param {string} relName
       * @returns {DataRow[]}
       */
      getParentRows: function (relName) {
        var rel = this.table.dataset.relations[relName];
        if (rel === undefined) {
          throw 'Relation ' + relName + ' does not exists in dataset ' + this.tables.dataset.name;
        }
        return rel.getParents(this.current);
      },

      /**
       * Gets all parent rows of this one
       * @returns {DataRow[]}
       */
      getAllParentRows: function () {
        return _(this.table.dataset.relationsByChild[this.table.name])
          .reduce(function (list, rel) {
            return list.concat(rel.getParents(this.current));
          }, [], this);
      },
      /**
       * Gets parents row of this row in a given table
       * @method getParentsInTable
       * @param {string} parentTableName
       * @returns {DataRow[]}
       */
      getParentsInTable: function(parentTableName){
        return _(this.table.dataset.relationsByChild[this.table.name])
          .filter({parentTableName: parentTableName})
          .reduce(function(list,rel) {
          return list.concat(rel.getParents(this.current));
        },[],this);
      },

      /**
       * Gets the child(s) of this row in the dataSet it is contained, following the relation with the
       *  specified name
       * @method getChildRows
       * @param {string} relName
       * @returns {DataRow[]}
       */
      getChildRows: function (relName) {
        var rel = this.tables.dataset.relations[relName];
        if (rel === undefined) {
          throw 'Relation ' + relName + ' does not exists in dataset ' + this.tables.dataset.name;
        }
        return rel.getChilds(this.current);
      },

      /**
       * Gets all child rows of this one
       * @returns {DataRow[]}
       */
      getAllChildRows: function () {
        return _(this.table.dataset.relationsByParent[this.table.name])
          .reduce(function (list, rel) {
            return list.concat(rel.getChilds(this.current));
          }, [], this);
      },

      /**
       * Gets child rows of this row in a given table
       * @method getChildsInTable
       * @param  {string} childTableName
       * @returns {DataRow[]}
       */
      getChildsInTable: function (childTableName) {
        return _(this.table.dataset.relationsByParent[this.table.name])
          .filter({childTableName: childTableName})
          .reduce(function (list, rel) {
            return list.concat(rel.getChilds(this.current));
          }, [], this);
      },

      /**
       * DataTable that contains this DataRow
       * @property table
       * @type {DataTable}
       */

      /**
       * Get an object with all key fields of this row
       * @method keySample
       * @returns {object}
       */
      keySample: function () {
        return _.pick(this.current, this.table.key);
      }

    };
    return DataRow;
  };

  if (isAngular) {
    // AngularJS module definition
    angular.module('dataset.datarow', ['dataset.dataenums']).
      factory('DataRow', ['dataRowVersion', 'dataRowState', dataRowFactory]);
  } else if (isNode) {
    // NodeJS module definition
    module.exports = dataRowFactory(
      require('./dataenums').dataRowVersion,
      require('./dataenums').dataRowState
    );
  }

})(typeof module !== 'undefined' && module.exports,
    typeof angular !== 'undefined');

