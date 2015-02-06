/*global angular,ObjectObserver,_ */
/*jslint nomen: true*/
'use strict';
/**
 * Shim for Ado.net DataTable class
 * @module DataSet
 * @submodule DataTable
 */
(function (isNode, isAngular) {
  var extLodash,
    dataTableFactory;

  if (typeof _ === 'undefined') {
    extLodash = require('lodash-node');
  } else {
    extLodash = _;
  }

  dataTableFactory = function ($rowState, DataRow, dataQuery) {
    var _ = extLodash;

    /**
     * Describe how to evaluate the value of a column before posting it
     * @class AutoIncrementColumn
     *
     **/

    /**
     * Create a AutoIncrementColumn
     * @method AutoIncrementColumn
     * @param {string} columnName
     * @param {object} options same options as AutoIncrement properties
     **/
    function AutoIncrementColumn(columnName, options){
      /**
       * name of the column that has to be auto-incremented
       * @property {string} columnName
       */
      this.columnName = columnName;

      /**
       * Array of column names of selector fields. The max() is evaluating filtering the values of those fields
       * @property {string[]} [selector]
       */
      this.selector = options.selector || [];

      /**
       * Array of bit mask to use for comparing selector. If present, only corrisponding bits will be compared,
       *  i.e. instead of sel=value it will be compared (sel & mask) = value
       * @property {number[]} [selectorMask]
       **/
      this.selectorMask = options.selectorMask || [];

      /**
       * A field to use as prefix for the evaluated field
       * @property {string} [prefixField]
       **/
      this.prefixField = options.prefixField;

      /**
       * String literal to be appended to the prefix before the evaluated max
       * @property {string} [middleConst]
       **/
      this.middleConst = options.middleConst;


      /**
       * for string id, the len of the evaluated max. It is not the overall size of the evaluated id, because a
       *  prefix and a middle const might be present
       * If idLen = 0 and there is no prefix, the field is assumed to be a number, otherwise a 0 prefixed string-number
       *  @property {number} [idLen=0]
       **/
      this.idLen  = options.idLen || 0;

      /**
       * Indicates that numbering does NOT depend on prefix value, I.e. is linear in every section of the calculated field
       * @property {boolean} [linearField=false]
       **/
      this.linearField = options.linearField || false;

      /**
       * Minimum temporary value for in-memory rows
       * @property {number} [minimum=0]
       **/
      this.minimum = options.minimum || 0;

      if (typeof options.isNumber === 'undefined'){
        this.isNumber = (this.idLen===0) && (typeof this.prefixField === 'undefined')
                && (typeof this.middleConst === 'undefined');
      }
      else {
        this.isNumber  = options.isNumber;
      }

      if (this.isNumber === false && this.idLen===0){
        this.idLen=12; //get a default for idLen
      }
    }

    AutoIncrementColumn.prototype  = {
      constructor: AutoIncrementColumn
    };

    /**
     * Gets a function that filter selector fields eventually masking with selectorMask
     * @param row
     * @returns {sqlFun}
     */
    AutoIncrementColumn.prototype.getFieldSelectorMask = function (row) {
      var that=this;
      if (typeof this.getInternalSelector === 'undefined') {
        this.getInternalSelector = function (r) {
          return dataQuery.and(
            _.map(that.selector, function (field, index) {
              if (that.selectorMask && that.selectorMask[index]) {
                return dataQuery.testMask(field, that.selectorMask[index], r[field]);
              } else {
                return dataQuery.eq(field, r[field]);
              }
            })
          );
        }
      }
      return this.getInternalSelector(row);
    };

    /**
     * evaluates the function to filter selector on a specified row and column
     * @method getSelector
     * @param {DataRow} r
     */
    AutoIncrementColumn.prototype.getSelector = function(r){
      var prefix = this.getPrefix(r),
        selector= this.getFieldSelectorMask(r);

      if (this.linearField === false && prefix !== '') {
        selector = dataQuery.and(selector, dataQuery.like(this.columnName, prefix + '%'));
      }
      return selector;
    };

    /**
     * Gets the prefix evaluated for a given row
     * @method getPrefix
     * @param r
     * @returns {string}
     */
    AutoIncrementColumn.prototype.getPrefix = function(r){
      var prefix = '';
      if (this.prefixField) {
        if (r[this.prefixField] !== null && r[this.prefixField] !== undefined)
          prefix += r[this.prefixField];
      }
      if (this.middleConst) {
        prefix += this.middleConst;
      }
      return prefix;
    };

    /**
     * gets the expression to be used for retrieving the max
     * @method getExpression
     * @param r
     */
    AutoIncrementColumn.prototype.getExpression = function (r) {
      var fieldExpr = dataQuery.field(this.columnName),
        lenToExtract,
        startSearch;
      if (this.isNumber){
        return dataQuery.max(fieldExpr);
      }
      startSearch = this.getPrefix(r).length;

      return dataQuery.max(dataQuery.convertToInt(dataQuery.substring(fieldExpr, startSearch+1, lenToExtract)));
    };
     /**
     * Cached function that evaluates selector basing on autoIncrement fields
     * @method [getSelector]
      * @return {sqlFun}
     **/


     /**
      * Custom function to be called to evaluate the maximum value
      * @method  [customFunction] ({DataRow} r, {string} columnName, {DataAccess} conn}
      **/



    /**
     * A DataTable is s collection of DataRow and provides information about the structure of logical table
     * @class DataTable
     */

    /**
     * DataSet to which this table belongs
     * @property {DataSet} dataset
     */

    /**
     * Creates an empty DataTable
     * @param {string} tableName
     * @constructor
     * @return {DataTable}
     */
    function DataTable(tableName) {
      /**
       * Name of the table
       * @property {string} name
       */
      this.name = tableName;

      /**
       * Collection of rows, each one hiddenly surrounded with a DataRow object
       * @property rows
       * @type {Array}
       */
      this.rows = [];

      /**
       * Array of key column names
       * @private
       * @property {string[]} myKey
       */
      this.myKey = [];

      /**
       * Set of properties to be assigned to new rows when they are created
       * @property {object} myDefaults
       * @private
       */
      this.myDefaults = {};

      /**
       * Array of column names
       * @property columns
       * @type {Array}
       */
      this.columns = [];

      this.autoIncrementColumns = {};

      /**
       * A ordering to use for posting of this table
       * @property postingOrder
       * @type {string | string[] | function}
       */
    }

    DataTable.prototype = {
      constructor: DataTable,

      /**
       * @private
       * @property maxCache
       * @type {object}
       */

      /**
       * Mark the table as optimized / not optimized
       * An optimized table has a cache for all autoincrement field
       * @method setOptimize
       * @param {boolean} value
       */
      setOptimized : function(value){
        if (value===false){
          this.maxCache = undefined;
          return;
        }
        if (this.maxCache === undefined){
          this.maxCache = {};
        }
      },

      /**
       * Check if this table is optimized
       * @method isOptimized
       * @returns {boolean}
       */
      isOptimized: function(){
        return this.maxCache !== undefined;
      },

      /**
       * Clear evaluated max cache
       * @method clearMaxCache
       */
      clearMaxCache: function(){
        if (this.maxCache !== undefined) {
          this.maxCache = {};
        }
      },

      /**
       * Set a value in the max cache
       * @method setMaxExpr
       * @param {string} field
       * @param {sqlFun} expr
       * @param {sqlFun} filter
       * @param {int} num
       */
      setMaxExpr: function (field, expr, filter, num) {
        if (this.maxCache === undefined) {
          return;
        }
        var hash = field + '§' + expr.toString() + '§' + filter.toString();
        this.maxCache[hash] = num;
      },

      /**
       * get/set the minimum temp value for a field, assuming 0 if undefined
       * @method minimumTempValue
       * @param  {string} field
       * @param {number} [value]
       */
      minimumTempValue: function (field, value){
        var autoInfo = this.autoIncrementColumns[field];
        if (autoInfo === undefined) {
          if (value === undefined) {
            return 0;
          }
          this.autoIncrementColumns[field] = new AutoIncrementColumn(field,{minimum: value});
        } else {
          if (value === undefined) {
            return autoInfo.minimum || 0;
          }
          autoInfo.minimum = value;
        }
      },

      /**
       * gets the max in cache for a field and updates the cache
       * @method getMaxExpr
        *@param {string} field
       * @param {sqlFun|string}expr
       * @param {sqlFun} filter
       * @return {number}
       */
      getMaxExpr: function(field,expr, filter){
        var hash = field + '§' + expr.toString() + '§' + filter.toString(),
          res=this.minimumTempValue(field);
        if (this.maxCache[hash] !== undefined){
          res = this.maxCache[hash];
        }
        this.maxCache[hash] = res+1;
        return res;
      },

      /**
       * Evaluates the max of an expression eventually using a cached value
       * @method cachedMaxSubstring
       * @param {DataRow} row
       * @param {string} field
       * @param {number} start
       * @param {number} len
       * @param {sqlFun} filter
       * @return {number}
       */
      cachedMaxSubstring: function (field, start, len, filter){
        var res,
          min,
          expr;
        if (!this.isOptimized()){
          return this.unCachedMaxSubstring(field, start, len, filter);

        }
        expr = field+'§' + start +'§'+len+'§'+filter.toString();
        return this.getMaxExpr(field, expr, filter);
      },

      /**
       *  Evaluates the max of an expression without using any cached value. If len = 0 the expression is treated
       *   as a number with max(field) otherwise it is performed max(convertToInt(substring(field,start,len)))
       * @param {string} field
       * @param {number} start
       * @param {number} len
       * @param {sqlFun} filter
       * @return {number}
       */
      unCachedMaxSubstring: function(field, start, len, filter){

        var res,
          min = this.minimumTempValue(field),
          expr,
          rows;
        if (start === 0 && len=== 0){
          expr = dataQuery.max(field);
        } else {
          expr = dataQuery.max(dataQuery.convertToInt(dataQuery.substring(field,start,len)));
        }

        rows = this.selectAll(filter);
        if (rows.length === 0){
          res = 0;
        } else {
          res = expr(rows);
        }

        if (res < min) {
          return min;
        }
        return res;
      },

      /**
       * Extract a set of rows matching a filter function - skipping deleted rows
       * @method select
       * @param {sqlFun} [filter]
       * @returns {DataRow[]}
       */
      select: function (filter) {
        if (filter === null || filter === undefined){
          return this.rows;
        }
        if (filter){
          if (filter.isTrue) {
            //console.log("always true: returning this.rows");
            return this.rows;
          }
          if (filter.isFalse){
            //console.log("always false: returning []");
            return [];
          }
        }
        return _.filter(this.rows, function(r){
          //console.log('actually filtering by '+filter);
          if (r.getRow().state === $rowState.deleted ){
            //console.log("skipping a deleted row");
            return false;
          }
          if (filter){
            //console.log('filter(r) is '+filter(r));
            return filter(r);
          }
          return true;
        });
      },

      /**
       * Extract a set of rows matching a filter function - including deleted rows
       * @method selectAll
       * @param {sqlFun} filter
       * @returns {DataRow[]}
       */
      selectAll: function (filter) {
        if (filter) {
          return _.filter(this.rows, filter);
        }
        return this.rows;
      },


      /**
       * Get the filter that compares key fields of a given row
       * @method keyFilter
       * @param {object} row
       * @returns {*|sqlFun}
       */
      keyFilter: function (row) {
        if (this.myKey.length === 0){
          throw 'No primary key specified for table:'+ this.name + ' and keyFilter was invoked.';
        }
        return dataQuery.mcmp(this.myKey, row);
      },

      /**
       * Compares the key of two objects
       * @param {object} a
       * @param {object} b
       * @returns {boolean}
       */
      sameKey: function(a,b){
        return _.find(this.myKey,function(k){return a[k]!== b[k];}) !== undefined;
      },

      /**
       * Get/Set the primary key in a Jquery fashioned style. If k is given, the key is set, otherwise the existing
       *  key is returned
       * @method key
       * @param {string[]} [k]
       * @returns {*|string[]}
       */
      key: function (k) {
        if (k === undefined) {
          return this.myKey;
        }
        if (_.isArray(k)) {
          this.myKey = _.clone(k);
        } else {
          this.myKey = Array.prototype.slice.call(arguments);
        }
        return this;
      },



      /**
       * Clears the table detaching all rows.
       * @method clear
       */
      clear: function () {
        var dr;
        _.forEach(this.rows, function (row) {
          dr = row.getRow();
          dr.table = null;
          dr.detach();
        });
        this.rows.length = 0;
      },

      /**
       * Detaches a row from the table
       * @method detach
       * @param obj
       */
      detach: function (obj) {
        var i = this.rows.indexOf(obj),
          dr;
        if (i >= 0) {
          this.rows.splice(i, 1);
        }
        dr = obj.getRow();
        dr.table = null;
        dr.detach();
      },

      /**
       * Adds an object to the table setting the datarow in the state of "added"
       * @method add
       * @param obj plain object
       * @returns DataRow created
       */
      add: function (obj) {
        var dr = this.load(obj);
        if (dr.state !== $rowState.unchanged) {
          return dr;
        }
        dr.state = $rowState.added;
        return dr;
      },

      /**
       * check if a row is present in the table. If there is  a key, it is used for finding the row,
       *  otherwise a ==== comparison is made
       * @method existingRow
       * @param obj
       * @return {DataRow | undefined}
       */
      existingRow: function(obj){
        if (this.myKey.length === 0){
          var i = this.rows.indexOf(obj);
          if (i === -1 ) {
            return undefined
          }
          return this.rows[i];
        }
        var arr = _.filter(this.rows,this.keyFilter(obj));
        if (arr.length === 0){
          return undefined;
        }
        return arr[0];
      },

      /**
       * Adds an object to the table setting the datarow in the state of "unchanged"
       * @method load
       * @param {object} obj plain object to load in the table
       * @param {bool} [safe=true] if false doesn't verify existence of row
       * @returns {DataRow} created DataRow
       */
      load: function (obj, safe) {
        var i,dr, oldRow;
        if (safe || safe === undefined) {
          oldRow = this.existingRow(obj);
          if (oldRow){
            return oldRow.getRow();
          }
        }
        dr = new DataRow(obj);
        dr.table = this;
        this.rows.push(obj);
        return dr;
      },

      /**
       * Adds an object to the table setting the datarow in the state of 'unchanged'
       * @method loadArray
       * @param {array} arr array of plain objects
       * @param {bool} safe if false doesn't verify existence of row
       */
      loadArray: function (arr, safe) {
        _.forEach(arr, function (o) {
          this.load(o, safe);
        }, this);
      },

      /**
       * Accept any changes setting all dataRows in the state of 'unchanged'.
       * Deleted rows become detached and are removed from the table
       * @method acceptChanges
       */
      acceptChanges: function () {
        //First detach all deleted rows
        var newRows = [];
        _.forEach(this.rows,function (o) {
          var dr = o.getRow();
          if (dr.state === $rowState.deleted) {
            dr.table = null;
            dr.detach();
          } else {
            dr.acceptChanges();
            newRows.push(o);
          }
        });
        this.rows = newRows;
      },

      /**
       * Reject any changes putting all to 'unchanged' state.
       * Added rows become detached.
       * @method rejectChanges
       */
      rejectChanges: function () {
        //First detach all added rows
        var newRows = [];
        _(this.rows).forEach(function (o) {
          var dr = o.getRow();
          if (dr.state === $rowState.added) {
            dr.table = null;
            dr.detach();
          } else {
            dr.rejectChanges();
            newRows.push(o);
          }
        });
        this.rows = newRows;
      },

      /**
       * Check if any DataRow in the table has changes
       * @method hasChanges
       * @returns {boolean}
       */
      hasChanges: function () {
        return _.some(this.rows, function (o) {
          return o.getRow().state !== $rowState.unchanged;
        });

      },

      /**
       * gets an array of all modified/added/deleted rows
       * @method getChanges
       * @returns {Array}
       */
      getChanges: function () {
        return _.filter(this.rows, function (o) {
          return o.getRow().state !== $rowState.unchanged;
        });
      },

      /**
       * Debug-helper function
       * @method toString
       * @returns {string}
       */
      toString: function () {
        return "DataTable " + this.name;
      },

      /**
       * import a row preserving it's state, the row should already have a DataRow attached
       * @method importRow
       * @param {object} row input
       * @returns {DataRow} created
       */
      importRow: function (row) {
        var dr = row.getRow(),
          newR,
          newDr;
        dr.commit();
        newR = {};
        _.forOwn(row, function (val, key) {
          newR[key] = val;
        });
        newDr = new DataRow(newR);  //this creates an observer on newR
        newDr.state = dr.state;
        newDr.old = _.clone(dr.old,true);
        newDr.added = _.clone(dr.added,true);
        newDr.removed = _.clone(dr.removed, true);
        this.rows.push(newR);
        return newDr;
      },

      /**
       * Get/set the object defaults in a JQuery fashioned style. When def is present, its fields and values are
       *  merged into existent defaults.
       * @method defaults
       * @param [def]
       * @returns {object|*}
       */
      defaults: function (def) {
        if (def === undefined) {
          return this.myDefaults;
        }
        _.assign(this.myDefaults, def);
        return this;
      },

      /**
       * Clears any stored default value for the table
       * @method clearDefaults
       */
      clearDefaults: function () {
        this.myDefaults = {};
      },

      /**
       * creates a DataRow and returns the created object. The created object has the default values merged to the
       *  values in the optional parameter obj.
       * @method newRow
       * @param {object} [obj] contains the initial value of the created objects.
       * @param {DataRow} [parentRow]
       * @returns {object}
       */
      newRow: function (obj, parentRow) {
        var n = {};
        _.assign(n, this.myDefaults);
        if (_.isObject(obj)) {
          _.assign(n, obj);
        }
        if (parentRow!== undefined){
          this.makeChild(n, parentRow.getRow().table.name, parentRow);
        }
        this.calcTemporaryId(n);
        this.add(n);
        return n;
      },

      /**
       * Make childRow child of parentRow if a relation between the two is found
       * @method makeChild
       * @param {object} childRow
       * @param {string} parentTable
       * @param {DataRow} [parentRow]
       */
      makeChild: function(childRow,parentTable,parentRow){
        var that = this,
          i,
          parentRel = _.find(this.dataset.relationsByParent[parentTable],
          function(rel){
            return rel.childTable === that.name;});
        if (parentRel === undefined) {
          return;
        }
        parentRel.makeChild(parentRow, childRow);

      },


      /**
       * Get/Set a flag indicating that this table is not subjected to security functions in a Jquery fashioned
       *  style
       * @method skipSecurity
       * @param {boolean} [arg]
       * @returns {*|boolean}
       */
      skipSecurity: function (arg) {
        if (arg === undefined) {
          if (this.hasOwnProperty('isSkipSecurity')) {
            return this.isSkipSecurity;
          }
          return false;
        }
        this.isSkipSecurity = arg;
        return this;
      },

      /**
       * Get/Set the name of table  to be used to read data from database in a Jquery fashioned style
       * @method tableForReading
       * @param {string} [tableName]
       * @returns {*|DataTable.myTableForReading|DataTable.name}
       */
      tableForReading: function (tableName) {
        if (tableName === undefined) {
          return this.myTableForReading || this.name;
        }
        this.myTableForReading = tableName;
        return this;
      },

      /**
       * Get/Set the name of table  to be used to write data from database in a Jquery fashioned style
       * @method tableForWriting
       * @param {string} [tableName]
       * @returns {*|DataTable.myTableForWriting|DataTable.name}
       */
      tableForWriting: function (tableName) {
        if (tableName === undefined) {
          return this.myTableForWriting || this.name;
        }
        this.myTableForWriting = tableName;
        return this;
      },

      /**
       * Get/Set a static filter  to be used to read data from database in a Jquery fashioned style
       * @method staticFilter
       * @param {sqlFun} [filter]
       * @returns {sqlFun}
       */
      staticFilter: function (filter) {
        if (filter === undefined) {
          return this.myStaticFilter;
        }
        this.myStaticFilter = filter;
      },

      /**
       * Get/set the ordering that have to be user reading from db
       * @param [fieldList]
       * @returns {*}
       */
      orderBy: function(fieldList){
        if (fieldList === undefined){
          return this.myOrderBy;
        }
        this.myOrderBy=fieldList;
        return this;
      },

      /**
       * get the list of columns
       * @method columnList
       * @returns {string}
       */
      columnList: function () {
        if (this.columns.length > 0) {
          return this.columns.join(',');
        }
        return '*';
      },

      /**
       * Gets all autoincrement column names of this table
       * @returns {string[]}
       */
      getAutoIncrementColumns: function(){
        return _.keys(this.autoIncrementColumns);
      },

      /**
       * Get/Set autoincrement properties of fields
       * @method autoIncrement
       * @param {string} fieldName
       * @param {object} [autoIncrementInfo] //see AutoIncrementColumn properties for details
       * @returns {*|AutoIncrementColumn}
       */
      autoIncrement : function(fieldName, autoIncrementInfo){
      if (autoIncrementInfo !== undefined){
        this.autoIncrementColumns[fieldName] = new AutoIncrementColumn(fieldName, autoIncrementInfo);
        return this;
      } else {
        return this.autoIncrementColumns[fieldName];
      }
    },

      /**
       * Get a serializable version of this table. If serializeStructure=true, also structure information is serialized
       * @param {bool} [serializeStructure=false]
       * @param {function} filterRow
       * @return {object}
       */
      serialize: function(serializeStructure, filterRow) {
        var t = {};
        if (serializeStructure) {
          t.key = this.key().join();
          t.tableForReading = this.tableForReading();
          t.tableForWriting = this.tableForWriting();
          t.orderBy = this.orderBy();
          //TODO: make a serializable version of sqlFun and use it for staticFilter
          //t.staticFilter(this.staticFilter());
          t.skipSecurity = this.skipSecurity();
          t.defaults = this.defaults();
          t.autoIncrementColumns = this.autoIncrementColumns;
          t.columns = this.columns;
        }
        t.rows = [];
        _.forEach(this.rows, function (r) {
          if (filterRow && filterRow(r)===false) {
            return; //skip this row
          }
          var row = r.getRow(),
            rowState = row.state,
            newRow  = {state: rowState};
          row.commit();
          if (rowState === $rowState.deleted || rowState === $rowState.unchanged || rowState === $rowState.modified){
            newRow.old = row.originalRow();
          }
          if (rowState === $rowState.modified || rowState == $rowState.added){
            newRow.curr = _.clone(r);
          }
          t.rows.push(newRow);
        });
        return t;
      },

      /**
       * Get data from a serialized structure. If serializeStructure=true, also structure information is serialized
       * @param {object} t
       * @param {bool} [deserializeStructure=false]
       * @return {*}
       */
      deSerialize: function (t, deserializeStructure) {
        var that = this;
        if (deserializeStructure) {
          this.key(t.key.slpit(','));
          this.tableForReading(t.tableForReading);
          this.tableForWriting(t.tableForWriting);
          this.skipSecurity(t.skipSecurity);
          this.defaults(t.defaults);
          this.orderBy(t.orderBy);
          if (t.autoIncrementColumns){
            this.autoIncrementColumns = _.clone(t.autoIncrementColumns);
          }
          if (t.columns){
            this.columns = _.clone(t.columns);
          }
        }
        _.forEach(t.rows, function (r) {
          var rowState = r.state;
          if (rowState === $rowState.added) {
            that.add(r.curr);
            return;
          }
          var newRow = that.load(r.old); //newRow is unchanged
          if (rowState === $rowState.deleted) {
            newRow.del();
            return;
          }
          if (rowState === $rowState.modified) {
            newRow.acceptChanges();
            newRow.makeEqualTo(r.curr);
          }
        });
      },

      /**
       * adds an array of objects to collection, as unchanged, if they still are not present. Existence is verified
       *  basing on  key
       * @method mergeArray
       * @param {DataRow []} arr
       * @param {bool} overwrite
       * @return {*}
       */
      mergeArray:  function(arr, overwrite){
        _.forEach(arr, function(r){
            var oldRow = this.existingRow(r);
            if (oldRow){
              if (overwrite){
                oldRow.getRow().makeEqualTo(r);
                oldRow.acceptChanges();
              }
            } else {
              this.load(r,false);
            }
        },
          this
        );
      },

      /**
       * clones table structure without copying any DataRow
       * @method clone
       * @return {DataTable}
       */
      clone: function () {
        var cloned = new DataTable(this.name);
        cloned.key(this.key());
        cloned.tableForReading(this.tableForReading());
        cloned.tableForWriting(this.tableForWriting());
        cloned.staticFilter(this.staticFilter());
        cloned.skipSecurity(this.skipSecurity());
        cloned.defaults(this.defaults());
        cloned.autoIncrementColumns = _.clone(this.autoIncrementColumns);
        cloned.columns = _.clone(this.columns);
        cloned.orderBy(this.orderBy());
        return cloned;
      },

      /**
       * Clones table structure and copies data
       * method @copy
       * @return {DataTable}
       */
      copy: function () {
        var cloned = this.clone();
        _.forEach(this.rows, function (row) {
          cloned.importRow(row);
        });
      },


      /**
       * Gets a filter of colliding rows supposing to change r[field]= value, on  a specified column
       * @method collisionFilter
       * @private
       * @param {DataRow} r
       * @param {string} field
       * @param {object} value
       * @param {AutoIncrementColumn} autoInfo
       * @return {sqlFun}
       */
      collisionFilter: function(r,field,value, autoInfo){
        var fields = [autoInfo.columnName].concat(autoInfo.selector),
          values = _.map(fields, function (k) {
            if (k !== field) {
              return r[k];
            }
            return value;
          });
        return dataQuery.mcmp(fields, values);
      },

      /**
       * Assign a field assuring it will not cause duplicates on table's autoincrement fields
       * @method safeAssign
       * @param r
       * @param field
       * @param value
       * @return {*}
       */
      safeAssign: function(r, field, value){
        this.avoidCollisions(r,field,value);
        this.assignField(r, field, value);
      },

      /**
       * check if changing a key field of a row it would collide with come autoincrement field. If it would,
       *  recalculates colliding rows/filter in accordance
       * @method avoidCollisions
       * @param {DataRow} r
       * @param {string} field
       * @param {object} value
       */
      avoidCollisions: function (r, field, value) {
        var that = this;
        var deps = this.fieldDependencies(field);
        if (this.autoIncrementColumns[field]){
          deps.unshift(field);
        }
        _.forEach(deps, function(depField){
          this.avoidCollisionsOnField(depField,
              this.collisionFilter(r, field, value, this.autoIncrementColumns[depField]));
        }, this);


      },

      /**
       * Recalc a field to avoid collisions on some rows identified by a filter
       * @method avoidCollisionsOnField
       * @private
       * @param {string} field
       * @param {sqlFun} filter
       */
      avoidCollisionsOnField: function (field, filter) {
        _.forEach(this.select(filter), function (rCollide) {
          this.calcTemporaryId(rCollide, field);
        },this);
      },

      /**
       * Assign a value to a field and update all dependencies
       * @method assignField
       * @param {DataRow} r
       * @param {string} field
       * @param {object} value
       */
      assignField: function (r, field, value) {
        this.cascadeAssignField(r, field, value); //change all child field
        r[field] = value;
        this.updateDependencies(r, field); //change all related field
      },

      /**
       * assign a value to a field in a row and all descending child rows
       * @method cascadeAssignField
       * @private
       * @param {DataRow} r
       * @param {string} parentField
       * @param {object} value
       */
      cascadeAssignField: function (r, parentField, value) {
        var ds = this.dataset;
        _.forEach(ds.relationsByParent[this.name], function (rel) {
          var pos = _.indexOf(rel.parentCols, parentField);
          if (pos >= 0) {
            var childField = rel.childCols[pos];
            _.forEach(rel.getChilds(r), function (childRow) {
              var childTable = ds.tables[rel.childTable];
              childTable.cascadeAssignField(childRow, childField, value);

              childRow[childField] = value;
              childTable.updateDependencies(childRow, childField);
            });
          }
        });
      },

      /**
       * Gets all autoincrement fields that depends on a given field, i.e. those having field as selector or prefixfield
       * @method fieldDependencies
       * @private
       * @param {string} field
       * @return {string[]}
       */
      fieldDependencies: function(field){
        var res = [];
        _.forEach(_.values(this.autoIncrementColumns), function (autoInfo) {
            if (autoInfo.prefixField === field) {
              res.push(autoInfo.columnName);
              return;
            }
            if (autoInfo.selector && _.indexOf(autoInfo.selector, field) >= 0) {
              res.push(autoInfo.columnName);
            }
          }
        );
        return res;
      },

      /**
       * Re calculate temporaryID affected by a field change. It should be done for every autoincrement field
       *  that has that field as a selector or as a prefix field
       * @method updateDependencies
       * @param {DataRow} row
       * @param {string} field
       * @returns {*}
       */
      updateDependencies: function(row, field){
        _.forEach(this.fieldDependencies(field), function(f){
          this.calcTemporaryId(row, f);
        }, this);
      },




      /**
       * Augment r[field] in order to avoid collision with another row that needs to take that value
       * if field is not specified, this is applied to all autoincrement field of the table
       * Precondition: r[[field] should be an autoincrement field
       * @method calcTemporaryId
       * @param {DataRow} r
       * @param {string} [field]
       */
      calcTemporaryId: function (r, field) {
        if (field === undefined) {
          _.forEach(_.keys(this.autoIncrementColumns), function (field) {
            this.calcTemporaryId(r, field);
          },this);
          return;
        }
        var that = this,
          prefix = '',
          newID = '1',
          fieldExpr,
          lenToExtract,
          evaluatedMax,
          autoIncrementInfo = this.autoIncrementColumns[field],
          selector = autoIncrementInfo.getSelector(r),
          startSearch;
          //expr  = autoIncrementInfo.getExpression(r);
          if (autoIncrementInfo.isNumber){
            evaluatedMax = this.cachedMaxSubstring(field, 0, 0, selector) + 1;
          } else {
            prefix= autoIncrementInfo.getPrefix(r);
            startSearch = prefix.length + 1;
            evaluatedMax = this.cachedMaxSubstring(field, startSearch, autoIncrementInfo.idLen, selector) + 1;
          }

        if (autoIncrementInfo.isNumber){
          newID = evaluatedMax;
        } else {

          newID = evaluatedMax.toString();
          if (autoIncrementInfo.idLen > 0) {
            while (newID.length < autoIncrementInfo.idLen) {
              newID = '0' + newID;
            }
          }
          newID = prefix + newID;
        }

        this.assignField(r, field, newID);

      }

    };
    return DataTable;

  };

  if (isAngular) {
    // AngularJS module definition
    angular.module('dataset.datatable', ['dataset.dataenums', 'dataset.datarow','dataset.dataquery'])
      .factory('DataTable', ['dataRowState', 'DataRow', 'dataQuery', dataTableFactory]);
  } else if (isNode) {
    // NodeJS module definition
    module.exports = dataTableFactory(
      require('./dataenums').dataRowState,
      require('./datarow'),
      require('./dataquery')
    );
  }

})(typeof module !== 'undefined' && module.exports,
    typeof angular !== 'undefined');



