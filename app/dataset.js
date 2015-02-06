/*global angular,ObjectObserver,_ */
/*jslint nomen: true*/
'use strict';
/**
 * Provides shim for Ado.net DataSet class
 * @module DataSet
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      FNOP = function () {
      },
      fBound = function () {
        return fToBind.apply(this instanceof FNOP && oThis ? this : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    FNOP.prototype = this.prototype;
    fBound.prototype = new FNOP();

    return fBound;
  };
}


(function (isNode, isAngular) {
  var extLodash,
    dsNameSpaceFactory;

  if (typeof _ === 'undefined') {
    extLodash = require('lodash-node');
  } else {
    extLodash = _;
  }

  dsNameSpaceFactory = function (dquery, DataTable, DataRow, dataRowState, dataRowVersion) {
    var _ = extLodash;

    /**
     * Manages auto fill of locking purposed fields and evaluates filter for optimistic locking for update
     * In his basic implementation accept a list of fields to fill. Values for filling are taken from
     *  environment.
     * @class OptimisticLocking
     * @method OptimisticLocking
     * @param {string[]} updateFields
     * @param {string[]} createFields
     * @constructor
     */
    function OptimisticLocking(updateFields, createFields) {
      this.updateFields = updateFields || [];
      this.createFields = createFields || [];
    }

    OptimisticLocking.prototype = {
      constructor: OptimisticLocking,

      /**
       * This function is called before posting row into db for every insert/update
       * @method prepareForPosting
       * @param {DataRow} r
       * @param {environment} env
       */
      prepareForPosting: function (r, env) {
        var row = r.getRow();
        if (row.state === dataRowState.added) {
          _.forEach(this.createFields, function (field) {
            r[field] = env.field(field);
          });
          return;
        }
        if (row.state === dataRowState.modified) {
          _.forEach(this.updateFields, function (field) {
            r[field] = env.field(field);
          });
        }
      },

      /**
       * Get the optimistic lock for updating a row
       * @method getOptimisticLock
       * @param {DataRow}r
       * @returns {sqlFun}
       */
      getOptimisticLock: function (r) {
        var row = r.getRow(),
          fields,
          key = row.table.key();
        if (key.length !== 0) {
          fields = key.concat(this.updateFields);
          return dquery.mcmp(fields,
            _.map(fields, function(f){
              return row.getValue(f, dataRowVersion.original);})
          );
        }
        return dquery.mcmp(_.keys(r), r);
      }
    };


    /**
     * Describe a relation between two DataTables of a DataSet.
     * @class DataRelation
     */


    /**
     * creates a DataRelation
     * @class DataRelation
     * @constructor DataRelation
     * @param {string} relationName
     * @param {string} parentTableName
     * @param {string[]} parentColsName array of string
     * @param {string} childTableName
     * @param {string[]} [childColsName=parentColsName] optional names of child columns
     * @return {DataRelation}
     */
    function DataRelation(relationName, parentTableName, parentColsName, childTableName, childColsName) {
      this.name = relationName;
      /**
       * Parent table name
       * @property parentTable
       * @type {string}
       */
      this.parentTable = parentTableName;

      /**
       * DataSet to which this DataRelation belongs to. It is used to retrieve parent and child table
       * @property dataSet
       * @type DataSet
       */
      this.dataset = null;

      /**
       * Array of parent column names or comma separated column names
       * @property parentCols
       * @type {string|string[]}
       */
      this.parentCols = _.isString(parentColsName)?
            _.map(parentColsName.split(','), function (s){return s.trim();})
          : _.clone(parentColsName);

      /**
       * Child table name
       * @property childTable
       * @type {string}
       */
      this.childTable = childTableName;

      /**
       * Array of child column names  or comma separated column names
       * @property childCols
       * @type {string|string[]}
       */
      if (childColsName) {
        this.childCols = _.isString(childColsName) ?
            _.map(childColsName.split(','), function (s) {return s.trim();})
          : _.clone(childColsName);
      } else {
        this.childCols = this.parentCols;
      }
    }

    DataRelation.prototype = {
      /**
       * Gets a filter that will be applied to the child table and will find any child row of a given DataRow
       * @method getChildsFilter
       * @param {object} parentRow
       * @param {string} [alias] when present is used to attach an alias for the parent table in the composed filter
       */
      getChildsFilter: function (parentRow, alias) {
        var that = this;
        return dquery.mcmp(that.childCols,
          _.map(that.parentCols, function (col) {
            return parentRow[col];
          }),
          alias
        );
      },

      /**
       * Get any child of a given DataRow following this DataRelation
       * @method getChilds
       * @param parentRow
       * @returns {array}
       */
      getChilds: function (parentRow) {
        var ds = this.dataset;
        if (ds===null){
          ds = parentRow.getRow().table.dataset;
        }
        var childTable = ds.tables[this.childTable];
        return _.filter(childTable.rows, this.getChildsFilter(parentRow));
      },

      /**
       * Gets a filter that will be applied to the parent table and will find any parent row of a given DataRow
       * @method getParentsFilter
       * @param {object} childRow
       * @param {string} [alias] when present is used to attach an alias for the parent table in the composed filter
       */
      getParentsFilter: function (childRow, alias) {
        var that = this;
        return dquery.mcmp(that.parentCols,
          _.map(that.childCols, function (col) {
            return childRow[col];
          }),
          alias
        );
      },


      /**
       * Get any parent of a given DataRow following this DataRelation
       * @method getParents
       * @param childRow
       * @returns {array}
       */
      getParents: function (childRow) {
        var ds = this.dataset;
        if (ds === null) {
          ds = childRow.getRow().table.dataset;
        }
        var parentTable = ds.tables[this.parentTable];
        return _.filter(parentTable.rows, this.getParentsFilter(childRow));
      },

      serialize: function(){
        var rel = {};
        //relation name is not serialized here, it is a key in the parent
        rel.parentTable = this.parentTable;
        //parent cols are serialized as a comma separated field list
        rel.parentCols  = this.parentCols.join();
        rel.childTable  = this.childTable;
        //child cols are not serialized if are same as parent cols
        if (this.childCols !== this.parentCols){
          rel.childCols = this.childCols.join();
        }
      },

      deSerialize: function () {
      },

      /**
       * get/set the activation filter for the relation, i.e. a condition that must be satisfied in order to
       *  follow the relation when automatically filling dataset from database. The condition is meant to be applied
       *  to parent rows
       * @param {sqlFun} [filter]
       * @returns {*}
       */
      activationFilter: function(filter){
        if (filter){
          this.myActivationFilter = filter;
        } else {
          return this.myActivationFilter;
        }
      },

      /**
       * Establish if  a relation links the key of  a table into a subset of another table key
       * @method isEntityRelation
       * @returns {boolean}
       */
      isEntityRelation: function(){
        var parent = this.dataset.tables[this.parentTable],
          parentKey = parent.key(),
          child = this.dataset.tables[this.childTable];
        if (parentKey.length !== this.parentCols.length) {
          return false;
        }
        //parent columns must be the key for parent table
        if(_.difference(parentKey, this.parentCols).length != 0){
          return false;
        }
        //child columns must be a subset of the child table key
        if (_.difference(this.childCols, child.key()).length > 0){
          return false;
        }
        return true;
      },

      /**
       * Modifies childRow in order to make it child of parentRow. Sets to null corresponding fields if
       *  parentRow is null or undefined
       * @method makeChild
       * @param parentRow
       * @param childRow
       * @return {*}
       */
      makeChild : function(parentRow, childRow){
        var i;
        for (i = 0; i < this.parentCols.length; i += 1) {
          if (parentRow === undefined || parentRow === null) {
            childRow[this.childCols[i]] = null;
          } else {
            childRow[this.childCols[i]] = parentRow[this.parentCols[i]];
          }
        }
      }
    };




    /**
     * Creates an empty DataSet
     * @class DataSet
     * @method DataSet
     * @param dataSetName
     * @returns {DataSet}
     * @constructor
     */
    function DataSet(dataSetName) {
      if (this.constructor !== DataSet) {
        return new DataSet(dataSetName);
      }
      /**
       * DataSet name
       * @property name
       */
      this.name = dataSetName;


      /**
       * Collection of DataTable where tables[tableName] is a DataTable named tableName
       * @property {Hash} tables
       */
      this.tables = {};


      /**
       * Collection of DataRelation  where relations[relName] is a DataRelation named relName
       * @property {Hash} relations
       */
      this.relations = {};

      /**
       * Gets all relations where the parent table is the key of the hash
       * relationsByParent['a'] is an array of all DataRelations where 'a' is the parent
       * @property relationsByParent
       * @type {DataRelation []}
       */
      this.relationsByParent = {};

      /**
       * Gets all relations where the child table is the key of the hash
       * relationsByChild['a'] is an array of all DataRelations where 'a' is the child
       * @property relationsByChild
       * @type {DataRelation []}
       */
      this.relationsByChild = {};

      /**
       * DataSet - level optmistic locking, this property is set in custom implementations
       * @property {OptimisticLocking} optimisticLocking
       */
    }



    DataSet.prototype = {
      constructor: DataSet,
      toString: function () {
        return "dataSet " + this.name;
      },

      /**
       * Clones a DataSet replicating its structure but without copying any DataRow
       * @method clone
       * @returns {DataSet}
       */
      clone: function () {
        var newDs = new DataSet(this.name);
        newDs.optimisticLocking = this.optimisticLocking;
        _.forEach(this.tables, function (t) {
          var newT = t.clone();
          newT.dataset = newDs;
          newDs.tables[newT.name] = newT;
          newDs.relationsByChild[newT.name] = [];
          newDs.relationsByParent[newT.name] = [];
        });
        _.forEach(this.relations, function (r) {
          newDs.newRelation(r.name, r.parentTable, r.parentCols, r.childTable, r.childCols);
        });
        return newDs;
      },

      /**
       * Creates a new DataTable attaching it to the DataSet
       * @method newTable
       * @param tableName
       * @returns {DataTable}
       */
      newTable: function (tableName) {
        if (this.tables[tableName]) {
          throw ("Table " + tableName + " is already present in dataset");
        }
        var t = new DataTable(tableName);
        t.dataset = this;
        this.tables[tableName] = t;
        this.relationsByChild[tableName] = [];
        this.relationsByParent[tableName] = [];
        return t;
      },

      /**
       * Creates a copy of the DataSet, including both structure and data.
       * @method copy
       * @returns {DataSet}
       */
      copy: function () {
        var newDS = this.clone();
        _.forEach(this.tables, function (t) {
          var newT = newDS.tables[t.name];
          _.forEach(t.rows, function (r) {
            newT.importRow(r);
          });
        });
        return newDS;
      },

      /**
       * Calls acceptChanges to all contained DataTables
       * @method acceptChanges
       */
      acceptChanges: function () {
        _.forEach(this.tables, function (t) {
          t.acceptChanges();
        });
      },

      /**
       * Calls rejectChanges to all contained DataTables
       * @method rejectChanges
       */
      rejectChanges: function () {
        _.forEach(this.tables, function (t) {
          t.rejectChanges();
        });
      },

      /**
       * Check if any contained DataTable has any changes
       * @method hasChanges
       * @returns {boolean}
       */
      hasChanges: function () {
        return _.some(this.tables, function (t) {
          return t.hasChanges();
        });
      },

      /**
       * Creates a new DataRelation and attaches it to the DataSet
       * @method newRelation
       * @param {string} relationName
       * @param {string} parentTableName
       * @param {string []} parentColsName array of string
       * @param {string} childTableName
       * @param {string []} childColsName array of string
       * @return {DataRelation}
       */
      newRelation: function (relationName, parentTableName, parentColsName, childTableName, childColsName) {
        if (this.relations[relationName]) {
          throw ("Relation " + relationName + " is already present in dataset");
        }
        if (this.tables[parentTableName] === undefined) {
          throw ("Parent table:'+parentTableName+' of relation " + relationName + " is not a dataSet table");
        }
        if (this.tables[childTableName] === undefined) {
          throw ("Child table:'+childTableName+' of relation " + relationName + " is not a dataSet table");
        }

        var rel = new DataRelation(relationName, parentTableName, parentColsName, childTableName, childColsName);
        rel.dataset = this;
        this.relations[relationName] = rel;

        if (!this.relationsByParent[parentTableName]){
          this.relationsByParent[parentTableName]= [];
        }
        this.relationsByParent[parentTableName].push(rel);



        if (!this.relationsByChild[childTableName]) {
          this.relationsByChild[childTableName] = [];
        }
        this.relationsByChild[childTableName].push(rel);

        return rel;
      },
      /**
       * Deletes a row with all subentity child
       * @method cascadeDelete
       * @param {DataRow} row
       * @return {*}
       */
      cascadeDelete: function(row){
        var r = row.getRow(),
          table= r.table;
        _.forEach(this.relationsByParent[table.name],function(rel){
          if (rel.isEntityRelation()){
            _.forEach(rel.getChilds(row), function(toDel){
              if (toDel.getRow().rowState !== dataRowState.deleted){
                this.cascadeDelete(toDel);
              }
            })
          } else {
            _.forEach(rel.getChilds(row), function (toUnlink) {
              rel.makeChild(null, toUnlink)}
            );
          }
        },this);
        r.del();
      },

      /**
       * Creates a serializable version of this DataSet
       * @method serialize
       * @param {bool} [serializeStructure=false] when true serialized also structure, when false only row data
       * @param {function} [filterRow] function to select which rows have to be serialized
       * @returns {object}
       */
      serialize : function(serializeStructure, filterRow){
        var d = {},
          that= this;
        if (serializeStructure) {
          d.name = this.name;
          d.relations = {};
          _.forEach(_.keys(this.relations), function (relationName) {
            d.relations[relationName] = that.relations[relationName].serialize();
          });
        }
        d.tables = {};
        _.forEach(_.keys(this.tables), function(tableName){
          d.tables[tableName] = that.tables[tableName].serialize(serializeStructure,filterRow);
        });
        return d;
      },

      /**
       * Restores data from an object obtained with serialize().
       * @method deSerialize
       * @param {object} d
       * @param {bool} deSerializeStructure
       */
      deSerialize: function(d, deSerializeStructure){
        var that = this;
        if (deSerializeStructure){
          this.name = d.name;
        }
        _.forEach(_.keys(d.tables), function (tableName) {
          var t  = that.tables[tableName];
          if (t===undefined){
            t = that.newTable(tableName);
          }
          t.deSerialize(d.tables[tableName]);
        });
        if (deSerializeStructure) {
          _.forEach(_.keys(d.relations), function (relationName) {
            var rel = d.relations[relationName],
             newRel = that.newRelation(relationName, rel.parentTable, rel.parentCols, rel.childTable, rel.childCols);
            newRel.deSerialize(rel);
          });
        }
      },

      /**
       * merges changes from DataSet d assuming they are unchanged and they can be present in this or not.
       * If a row is not present, it is added. If it is present, it is updated.
       * It is assumed that "this" dataset is unchanged at the beginning
       * @method mergeAsPut
       * @param {DataSet} d
       */
      mergeAsPut: function(d){
        var that = this;
        _.forEach(d.tables,function(t){
          var t2 = that.tables[t.name];
          _.forEach(t.rows, function(r){
            var existingRow = t2.select(t2.keyFilter(r));
            if (existingRow.length === 0){
              t2.add(_.clone(r));
            } else {
              existingRow[0].getRow().makeEqualTo(r);
            }
          })
        })
      },

      /**
       * merges changes from DataSet d assuming they are unchanged and they are not present in this dataset.
       * Rows are all added 'as is' to this, in the state of ADDED
       * It is assumed that "this" dataset is unchanged at the beginning
       * @method mergeAsPost
       * @param {DataSet} d
       */
      mergeAsPost: function (d) {
        var that = this;
        _.forEach(d.tables, function (t) {
          var t2 = that.tables[t.name];
          _.forEach(t.rows, function (r) {
            t2.add(_.clone(r));
          })
        })
      },

      /**
       * merges changes from DataSet d assuming they are unchanged and they are all present in this dataset.
       * Rows are updated, but only  fields actually present in d are modified. Other field are left unchanged.
       * It is assumed that "this" dataset is unchanged at the beginning
       * @method mergeAsPatch
       * @param {DataSet} d
       */
      mergeAsPatch: function (d) {
        var that = this;
        _.forEach(d.tables, function (t) {
          var t2 = that.tables[t.name];
          _.forEach(t.rows, function (r) {
            var existingRow = t2.select(t.keyFilter(r));
            if (existingRow.length === 1) {
              existingRow[0].getRow().patchTo(r);
            }
          })
        })
      },

      /**
       * Import data from a given dataset
       * @method importData
       * @param {DataSet}  d
       */
      importData: function(d){
        this.mergeAsPost(d);
        this.acceptChanges();
      }
    };




    return {
      dataRowState: dataRowState,
      dataRowVersion: dataRowVersion,
      DataSet: DataSet,
      DataRow: DataRow,
      toString: function () {
        return "dataSet Namespace";
      },
      OptimisticLocking: OptimisticLocking,
      myLoDash:_ //for testing purposes
    };


  };

  if (isAngular) {
    angular.module('dataset', ['dataset.dataenums', 'dataset.dataquery', 'dataset.datarow', 'dataset.datatable'])
      .factory('dsNameSpace', ['dataQuery', 'DataTable', 'DataRow', 'dataRowState', 'dataRowVersion', dsNameSpaceFactory]);
  } else if (isNode) {
    // NodeJS module definition
    module.exports = dsNameSpaceFactory(
      require('./dataquery'),
      require('./dataTable'),
      require('./datarow'),
      require('./dataenums').dataRowState,
      require('./dataenums').dataRowVersion
    );
  }
})(typeof module !== 'undefined' && module.exports,
    typeof angular !== 'undefined');







