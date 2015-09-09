/**
 * Created by Gaetano Lazzo on 07/02/2015.
 * Thanks to lodash, ObjectObserve
 */
/*jslint nomen: true*/
/*jslint bitwise: true */
;
'use strict';

(function(_,ObjectObserver) {
    /** Used as a safe reference for `undefined` in pre-ES5 environments. (thanks lodash)*/
    var undefined;


    /**
     * Escapes special characters in a string
     * @method myRegExpEscape
     * @private
     * @param str the string to be escaped
     * @return {String} escaped string
     */
    var myRegExpEscape = function (str) {
        return str.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1'); // str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    };


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



    /** Used to determine if values are of the language type `Object`. (thanks lodash)*/
    var objectTypes = {
        'function': true,
        'object': true
    };

    /**
     * Used as a reference to the global object. (thanks lodash)
     *
     * The `this` value is used if it is the global object to avoid Greasemonkey's
     * restricted `window` object, otherwise the `window` object is used.
     */
    var root = (objectTypes[typeof window] && window !== (this && this.window)) ? window : this;

    /** Detect free variable `exports`. (thanks lodash) */
    var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. (thanks lodash)*/
    var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
        root = freeGlobal;
    }

    /** Detect the popular CommonJS extension `module.exports`. (thanks lodash)*/
    var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;


    function isAngularField(f) {
        return (f.substr(0, 2) === '$$');
    }


    /**
     * provides DataRow enumeration constants
     * @module DataSet
     * @submodule dataenums
     */

    /**
     * Enumerates possible state of a DataRow: detached, deleted, added, unchanged, modified
     * @type {dataRowState}
     */
    var $rowState = {
            detached: "detached",
            deleted: "deleted",
            added: "added",
            unchanged: "unchanged",
            modified: "modified"
        },

        /**
         * Enumerates possible version of a DataRow field: original, current
         * @type {dataRowVersion}
         */  $rowVersion = {
            original: "original",
            current: "current"
        };


    /**
     * DataRow shim, provides methods to treat objects as Ado.Net DataRows
     * @module DataSet
     * @submodule DataRow
     */

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
            if (dataRowVer === $rowVersion.original){
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
            var that= this;
            return _(this.table.dataset.relationsByChild[this.table.name])
                .value()
                .reduce(function (list, rel) {
                    return list.concat(rel.getParents(that.current));
                }, [], this);
        },
        /**
         * Gets parents row of this row in a given table
         * @method getParentsInTable
         * @param {string} parentTableName
         * @returns {DataRow[]}
         */
        getParentsInTable: function(parentTableName){
            var that= this;
            return _(this.table.dataset.relationsByChild[this.table.name])
                .filter({parentTable: parentTableName})
                .value()
                .reduce(function(list,rel) {
                    return list.concat(rel.getParents(that.current));
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
            var rel = this.table.dataset.relations[relName];
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
            var that = this;
            return _(this.table.dataset.relationsByParent[this.table.name])
                .value()
                .reduce(function (list, rel) {
                    return list.concat(rel.getChilds(that.current));
                }, []);
        },

        /**
         * Gets child rows of this row in a given table
         * @method getChildsInTable
         * @param  {string} childTableName
         * @returns {DataRow[]}
         */
        getChildsInTable: function (childTableName) {
            var that = this;
            return _(this.table.dataset.relationsByParent[this.table.name])
                .filter({childTable: childTableName})
                .value()
                .reduce(function (list, rel) {
                    return list.concat(rel.getChilds(that.current));
                }, []);
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





    /**
     * Provides utility functions to filter data and to create sql condition over database.
     * Every function returns a function f where:
     * f ( r, context )  = true if r matches condition in the given context
     * f( r, context ) = result  evaluated in the given context if f is a computation function
     * f.isTrue = true if f is always true
     * f.isFalse = true if f is always false
     * f ( r, context) = undefined if there is no sufficient data to evaluate f
     * null fields and undefined fields are all considered (and returned) as null values (so they compare equal)
     * f.toSql(formatter, context)  = a string representing the underlying condition to be applied to a database.
     *  formatter is used to obtain details about making the expression, see sqlFormatter for an example
     *  [context] is the context into which the expression have to be evaluated
     *  @module DataSet
     *  @submodule DataQuery
     */

    /**
     * Function with ability to be converted to sql. When invoked gives a result depending on the arguments.
     * @class sqlFun
     *
     */

    /**
     * Converts a SqlFun into a string
     * @method toSql
     */


    /**
     * Compare function provider to help building conditions that can be applyed both to collections,
     *  using the returned function as a filter, or to a database, using the toSql() method
     *  @class dataQuery
     */

    /**
     * collection of function generators
     * @class DataQuery
     * @property {string} tableName table to which this field has been taken in a select
     * @property {boolean} constant true if it is a constant expression, false otherwise
     * @property {string} fieldName name of this field in the select result
     * @property {boolean} [isTrue] true if the function is the true constant
     * @property {boolean} [isFalse] true if the function is the false constant
     */

    /**
     * Check if an object is the null or undefined constant
     * @method isNullOrUndefined
     * @param o
     * @return {boolean} true if o is null or undefined
     */
    function isNullOrUndefined(o) {
        return _.isUndefined(o) || _.isNull(o);
    }

    /**
     * Adds some useful methods and properties to a function in order to transform it into a sqlFun
     * @method sqlFun
     * @param {function} f
     * @param {function} toSql
     * @return {sqlFun}
     */
    function toSqlFun(f, toSql) {
        var fun = f;
        var tryInvoke = f();
        if (tryInvoke !== undefined) {
            f = constant(tryInvoke);
        } else {
            f.constant = false;
            f.toSql = toSql;
        }
        f.as = as;
        return f;
    }


    function as(fieldName){
        this.fieldName = fieldName;
    }

    function skipUndefined(f,value){
        return function(r,context){
            if (r === undefined){
                return undefined;
            }
            return f(r,context);
        }
    }



    /**
     * returns  a function that given an environment will give the input functions applied to that.
     * @method context
     * @param environmentFunction
     * @return {sqlFun}
     * @example if environment = {a:1, b:2} and envifonmentFunction = function (env){return env.a}
     *   context(environmentFunction) applied to environment will return 1
     */
    function context(environmentFunction){
        var f = function(environment){
            if (environment === undefined){
                return undefined;
            }
            return environmentFunction(environment);
        };
        f.toSql = function(formatter, environment) {
            return formatter.quote(environmentFunction(environment));
        };
        f.as = as;
        f.constant = false;
        f.toString = function(){
            return 'context('+environmentFunction.toString()+')';
        };
        return f;
    }




    /**
     * Gets a field from an object. This is a very important function to distinguish between generic strings and
     *  field names.
     * @method field
     * @param fieldName
     * @param {string} [tableName]
     * @return {sqlFun} f such that
     *  f(r) = r[fieldName]
     *  f.toSql() = 'fieldName' or 'tableName.fieldName' where tableName is specified
     *
     */
    function field(fieldName, tableName) {
        var f = function (r) {
            if (r===undefined){
                return undefined;
            }
            if (r.hasOwnProperty(fieldName)) {
                return r[fieldName];
            }
            return null;
        };
        f.tableName = tableName;
        f.fieldName = fieldName;
        f.toString  = function(){return fieldName};
        var toSql = function (formatter) {
            return formatter.field(fieldName, tableName);
        };
        return toSqlFun(f,toSql);
    }




    /**
     * @private
     * transform strings into fields, leaves other things unchanged
     * For example 'a' becomes f(r)-> r['a'],
     *  12 is returned unchanged,
     *  a function is returned  unchanged
     * @method autofield
     * @param {sqlFun} p
     * @return {sqlFun}
     */
    function autofield(p) {
        if (_.isString(p)) {
            return field(p); //p is considered a field name
        }
        return p;
    }


    /**
     * Defines a constant function. The toSql method invokes the formatter.quote function
     * @method constant
     * @param {object} K is a literal
     * @return {sqlFun} f such that f()= k, f.toSql()= formatter.quote(k)
     */
    function constant(K) {
        var k = K;
        if (k === undefined){
            k = null;
        }
        var f = function () {
            return k;
        };
        f.toString = function(){return 'constant('+ k.toString()+')'};
        f.constant = true;
        f.as = as;
        if (k===true){
            f.isTrue=true;
            f.toSql = function (formatter) {
                return formatter.eq(1,1);
            };
            return f;
        }

        if (k === false) {
            f.isFalse = true;
            f.toSql = function (formatter) {
                return formatter.eq(1, 0);
            };
            return f;
        }

        /*
         The .toSql method of a constant calls directly the quote method of the formatter. HERE is where the
         tree top-down scan ends.
         */
        f.toSql = function (formatter) {
            return formatter.quote(k);
        };
        return f;
    }


    /**
     * Evaluates an expression in a given context
     * @method calc
     * @param expr function representing a generic expression
     * @param {object} r
     * @param {object} context
     * @return {Object} expr evaluated in the context r
     *  undefined are returned as null constant
     */
    function calc(expr, r, context) {
        if (isNullOrUndefined(expr)) {
            return expr;
        }
        //if expr has .toSql extension, it can be directly evaluated with a simple invoke. If it is called with
        // undefined, and it is not a constant, it must return undefined. In no other case undefined is
        // allowed as return value from sqlFun invocation
        if (expr.toSql) {
            return expr(r, context);
        }
        //if expr is an array, a new array is returned where each element is the evaluation of the
        // corresponding element in the original array
        if (_.isArray(expr)) {
            return _.map(expr, function (el) {
                return calc(el, r, context);
            });
        }
        //any other object is returned as is
        return expr;
    }

    /**
     * Check if an expression evaluates to null
     * @method isNull
     * @param expr1
     * @return {sqlFun} f where f(expr) = true if expr evaluates to null or undefined
     *  f.toSql() = something like '(EXPR is null)' where EXPR is the sql representation of the given expr
     */
    function isNull(expr1) {
        var expr = autofield(expr1);
        var f = function (r, context) {
            if (isNullOrUndefined(expr)) {
                return true;
            }
            var res =calc(expr, r, context);
            if (res === undefined) {
                return undefined;
            }
            return  (res===null);
        };
        var toSql = function (formatter, context) {
            return formatter.isNull(expr, context);
        };
        return toSqlFun(f,toSql);
    }




    /**
     * @method minus
     * @param expr1
     * @return {sqlFun} f where f(r) = - r. r should evaluate into a number
     */
    function minus(expr1) {
        var expr = autofield(expr1);
        var f = function (r, context) {
            var v1 = calc(expr, r, context);
            if (isNullOrUndefined(v1)) {
                return v1;
            }
            return -v1;
        };
        f.toString = function(){
            return '-'+expr.toString();
        };
        var toSql = function (formatter, context) {
            return formatter.minus(expr, context);
        };
        return toSqlFun(f,toSql);
    }




    /**
     * @method not
     * @param expr1
     * @return {sqlFun} f where f(r) = not r. r should evaluate into a boolean
     */
    function not(expr1) {
        var expr = autofield(expr1);
        var f = function (r, context) {
            var v1 = calc(expr, r, context);
            if (isNullOrUndefined(v1)) {
                return v1;
            }
            return !v1;
        };
        f.toString = function () {
            return 'not(' + expr.toString()+')';
        };
        var toSql = function (formatter, context) {
            return formatter.not(expr, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Check if the nth bit of expression is set
     * @method bitSet
     * @param expression note: this is autofield-ed, so if you can use a field name for it
     * @param nbit
     * @return {sqlFun}
     */
    function bitSet(expression, nbit) {
        var expr = autofield(expression),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined){
                    return undefined;
                }
                if (v1==null){
                    return false;
                }
                v2 = calc(nbit, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2===null) {
                    return false;
                }
                return (v1 & (1 << v2)) !== 0;
            };
        f.toString = function(){
            return 'bitSet('+expr.toString()+','+nbit.toString()+')';
        };
        var toSql = function (formatter, context) {
            return formatter.bitSet(expr, nbit, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Check if the nth bit of expression is not set
     * @method bitClear
     * @param expression note: this is autofield-ed, so if you can use a field name for it
     * @param nbit
     * @return {sqlFun}
     */
    function bitClear(expression, nbit) {
        var expr = autofield(expression),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(nbit, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                return (v1 & (1 << v2)) === 0;
            };
        f.toString = function () {
            return 'bitClear(' + expr.toString() + ',' + nbit.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.bitClear(expr, nbit, context);
        };
        return toSqlFun(f,toSql);

    }


    /**
     * check if expr1 & mask === val & mask
     * @method testMask
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {expression} mask
     * @param {expression} val
     * @return {sqlFun}
     */
    function testMask(expr1, mask, val) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2,v3;
                if (v1==undefined){
                    return undefined;
                }
                if (v1 == null) {
                    return false;
                }
                v2 = calc(mask, r, context);
                if (v2 == undefined) {
                    return undefined;
                }
                if (v2 == null) {
                    return false;
                }
                v3 = calc(val, r, context);
                if (v3 == undefined) {
                    return undefined;
                }
                if (v3 == null) {
                    return false;
                }
                return ((v1 & v2) === (v3 & v2));
            };

        f.toString = function () {
            return 'testMask(' + expr.toString() + ',' + mask.toString() + ',' + val.toString() + ')';
        };

        var toSql = function (formatter, context) {
            return formatter.testMask(expr, mask, val, context);
        };
        return toSqlFun(f,toSql);
    }




    /**
     * Check if expr1 evaluates between min and max
     * @method between
     * @param expr1  note: this is autofield-ed, so if you can use a field name for it
     * @param min
     * @param max
     * @returns {sqlFun}
     */
    function between(expr1, min, max) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2,v3;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(min, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null ) {
                    return false;
                }
                v3 = calc(max, r, context);
                if (v3===undefined){
                    return undefined;
                }
                if (v3 === null) {
                    return false;
                }
                return (v1 >= v2) && (v1 <= v3);
            };
        f.toString = function () {
            return 'between(' + expr.toString() + ',' + min.toString() + ',' + max.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.between(expr, min, max, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Checks if expr1 is (sql-like) mask, where mask can contain * and _ characters
     * @method like
     * @param expr1 {string} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param mask {string} mask is a string or a function that evaluates into a string
     * @returns {sqlFun}
     * @example like('a','s%') compiles into (a like 's%')
     *        like(const('a'),'s%') compiles into ('a' like 's%')
     */
    function like(expr1, mask) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2, likeExpr;
                if (v1===undefined){
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(mask, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                likeExpr = myRegExpEscape(v2);
                return (new RegExp(likeExpr.replace(new RegExp('%', 'g'), ".*").replace(new RegExp('_', 'g'), ".")).exec(v1) !== null);
            };
        f.toString = function () {
            return 'like(' + expr.toString() + ',' + mask.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.like(expr, mask, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Finds distinct values of a field
     * @method distinctVal
     * @param arr
     * @param fieldname
     * @returns {object[]}
     */
    function distinctVal(arr, fieldname) {
        if (arr === undefined) {
            return undefined;
        }
        if (fieldname) {
            return _.uniq(_.map(arr, fieldname));
        }
        return _.uniq(arr);
    }

    /**
     * Finds distinct values of a field
     * @method distinctVal
     * @param {sqlFun} exprList
     * @returns {sqlFun}
     */
    function distinct(exprList) {
        var f = function (arr, context) {
            if (arr === undefined) {
                return undefined;
            }
            var someUndefined = false,
                res = _.map(arr, function (a) {
                    return _.reduce(exprList, function(accumulator,expr){
                        var o = calc(expr, a, context);
                        if (o === undefined) {
                            someUndefined = true;
                        }
                        accumulator.push(o);
                        return accumulator;

                    },[]);
                });
            if (someUndefined) {
                return undefined;
            }
            return _.uniq(res);
        };
        f.toString = function () {
            return 'distinct(' + arrayToString(exprList) + ')';
        };
        var toSql = function (formatter,context){
            return formatter.distinct(exprList);
        };
        return toSqlFun(f,toSql);
    }


    /**
     * checks if expr1 is in the array list
     * @method isIn
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param list {array} Array or function that evaluates into an array
     * @returns {sqlFun}
     */
    function isIn(expr1, list) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v = calc(expr, r, context),l;
                if (v === undefined) {
                    return undefined;
                }
                if (v === null) {
                    return false;
                }

                l = calc(list, r, context);
                if (l === undefined) {
                    return undefined;
                }
                if (l === null) {
                    return false;
                }
                return (_.indexOf(l, v) >= 0);
            };
        f.toString = function () {
            return 'isIn(' + expr.toString() + ',' + arrayToString(list) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.isIn(expr, list, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if expr1 is not in the array list
     * @method isNotIn
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param list {array} Array or function that evaluates into an array
     * @returns {sqlFun}
     */
    function isNotIn(expr1, list) {
        return not(isIn(expr1, list, context));
    }

    function toString(o){
        if (o===undefined){
            return 'undefined';
        }
        if (o === null) {
            return 'null';
        }
        return o.toString();
    }

    /**
     * checks if expr1 evaluates equal to expr2
     * @method eq
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function eq(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                return v1 === v2;
            };

        f.toString = function () {
            return 'eq(' + toString(expr) + ',' + toString(expr2) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.eq(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if expr1 evaluates different from expr2
     * @method ne
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function ne(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                return v1 !== v2;
            };
        f.toString = function () {
            return 'ne(' + expr.toString() + ',' + expr2.toString()  + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.ne(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }


    /**
     * checks if expr1 evaluates less than from expr2
     * @method lt
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function lt(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                return v1 < v2;
            };
        f.toString = function () {
            return 'lt(' + expr.toString() + ',' + expr2.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.lt(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if expr1 evaluates less than or equal to from expr2
     * @method le
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function le(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }

                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                return v1 <= v2;
            };
        f.toString = function () {
            return 'le(' + expr.toString() + ',' + expr2.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.le(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if expr1 evaluates greater than expr2
     * @method gt
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function gt(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined ) {
                    return undefined;
                }
                if (v1 === null ) {
                    return false;
                }
                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }

                return v1 > v2;
            };
        f.toString = function () {
            return 'gt(' + expr.toString() + ',' + expr2.toString() + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.gt(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if expr1 evaluates greater than or equal to expr2
     * @method ge
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function ge(expr1, expr2) {
        var expr = autofield(expr1),
            f = function (r, context) {
                var v1 = calc(expr, r, context),v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null ) {
                    return false;
                }
                v2 = calc(expr2, r, context);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }

                return v1 >= v2;
            };

        f.toString = function () {
            return 'ge(' + toString(expr) + ',' + toString(expr2) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.ge(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if at least one of supplied expression evaluates to a truthy value
     * @method or
     * @param arr {array} array or list of expression
     * @returns {sqlFun}
     */
    function or(arr) {
        var a = arr,
            alwaysTrue = false,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        var optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            if (el === null) {
                return false;
            }

            if (el === false) {
                return false;
            }
            if (el.isFalse) {
                return false;
            }

            if (el === true || el.isTrue) {
                alwaysTrue = true;
            }
            return true;
        });
        if (alwaysTrue){
            return constant(true);
        }
        if (optimizedArgs.length === 0) {
            return constant(false);
        }

        f = function (r, context) {
            var i,
                someUndefined = false;
            for (i = 0; i < optimizedArgs.length; i += 1) {
                var x = calc(optimizedArgs[i], r, context);
                if (x === true) {
                    return true;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return false;
        };
        f.toString = function () {
            return 'or(' + arrayToString(a) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.joinOr(_.map(optimizedArgs, function (v) {
                return formatter.toSql(v, context);
            }));
        };
        return toSqlFun(f,toSql);
    }

    /**
     * return the first object not null in the  array parameter
     * @param {sqlFun[]} arr
     * @returns {sqlFun}
     */
    function coalesce(arr) {
        var a = arr,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function (r, context) {
            var i,
                someUndefined = false;
            for (i = 0; i < a.length; i += 1) {
                var x = calc(a[i], r, context);
                if (x === undefined) {
                    return undefined;
                }
                if (x !== null) {
                    return x;
                }
            }
            return null;
        };
        f.toString = function () {
            return 'coalesce(' + arrayToString(a) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.coalesce(_.map(a, function (v) {
                return formatter.toSql(v, context);
            }));
        };
        return toSqlFun(f, toSql);
    }


    /**
     * checks if expr1 is null or equal to expr2
     * @method isNullOrEq
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @return {sqlFun}
     */
    function isNullOrEq(expr1, expr2) {
        var expr = autofield(expr1);
        return or(isNull(expr), eq(expr, expr2));
    }

    /**
     * checks if expr1 is null or greater than expr2
     * @method isNullOrGt
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function isNullOrGt(expr1, expr2) {
        var expr = autofield(expr1);
        return or(isNull(expr), gt(expr, expr2));
    }

    /**
     * checks if expr1 is null or greater than or equal to expr2
     * @method isNullOrGe
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @return {sqlFun}
     */
    function isNullOrGe(expr1, expr2) {
        var expr = autofield(expr1);
        return or(isNull(expr), ge(expr, expr2));
    }

    /**
     * checks if expr1 is null or less than expr2
     * @method isNullOrLt
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @return {sqlFun}
     */
    function isNullOrLt(expr1, expr2) {
        var expr = autofield(expr1);
        return or(isNull(expr), lt(expr, expr2));
    }

    /**
     * checks if expr1 is null or less than or equal to expr2
     * @method isNullOrLe
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @returns {sqlFun}
     */
    function isNullOrLe(expr1, expr2) {
        var expr = autofield(expr1);
        return or(isNull(expr), le(expr, expr2));
    }

    /**
     * Evaluates the maximum value of an expression in a table. If any undefined is found, return undefined.
     * Null are skipped. If all is null return null
     * @method max
     * @param {expression} expr1
     * @returns {sqlFun}
     */
    function max(expr1){
        var expr = autofield(expr1),
            f = function (arr, context) {
                if (arr === undefined) {
                    return undefined;
                }
                var m=null;
                _.forEach(arr, function (el) {
                    var val = calc(expr, el, context);
                    if (val === undefined) {
                        m = undefined; //if any undefined is found, return undefined
                        return false;
                    }
                    if (m === null) {
                        m = val;
                        return;
                    }
                    if (val === null) {
                        return;
                    }
                    if (val > m) {
                        m = val;
                    }
                });
                return m;
            };
        f.toString = function () {
            return 'max(' + expr.toString() + ')';
        };

        f.grouping = true;
        var toSql = function (formatter, context) {
            return formatter.max(expr, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Evaluates the minimum value of an expression in a table. If any undefined is found, return undefined.
     * Null are skipped. If all is null return null
     * @method min
     * @param {expression} expr1
     * @returns {sqlFun}
     */
    function min(expr1) {
        var expr = autofield(expr1),
            f = function (arr, context) {
                if (arr === undefined) {
                    return undefined;
                }
                var m = null;
                _.forEach(arr, function(el){
                    var val= calc(expr, el, context);
                    if (val === undefined) {
                        m = undefined; //if any undefined is found, return undefined
                        return false;
                    }
                    if (m === null){
                        m=val;
                        return;
                    }
                    if (val===null){
                        return;
                    }
                    if (val < m){
                        m=val;
                    }
                });
                return m;
            };
        f.toString = function () {
            return 'min(' + expr.toString() + ')';
        };

        f.grouping = true;
        var toSql = function (formatter, context) {
            return formatter.min(expr, context);
        };
        return toSqlFun(f,toSql);
    }



    /**
     * @method substring
     * @param {expression} expr1
     * @param {number} start
     * @param {number} len
     * @returns {sqlFun}
     */
    function substring(expr1,start,len) {
        var expr = autofield(expr1),
            f = function (r, context) {
                if (r === undefined) {
                    return undefined;
                }
                var vExpr = calc(expr, r, context),vStart,vLen;
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null) {
                    return null;
                }

                vStart = calc(start, r, context);
                if (vStart === undefined ) {
                    return undefined;
                }
                if (vStart === null ) {
                    return null;
                }
                vStart -= 1; //javascript substring starting index is 0, sql is 1
                vLen = calc(len, r, context);
                if (vLen===undefined){
                    return undefined;
                }
                if (vLen === null) {
                    return null;
                }
                if (vStart<0){
                    vStart=0;
                }
                return vExpr.substr(vStart,vLen);
            };
        f.toString = function () {
            return 'substring(' + toString(expr) +','+ toString(start)+','+toString(len)+ ')';
        };

        var toSql = function (formatter, context) {
            return formatter.substring(expr, start, len, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Converts a generic expression into an integer
     * @method convertToInt
     * @param {expression} expr1
     * @returns {sqlFun}
     */
    function convertToInt(expr1) {

        var expr = autofield(expr1),
            f = function (r, context) {
                if (r === undefined) {
                    return undefined;
                }
                var vExpr = calc(expr, r, context);
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null || vExpr=== '') {
                    return null;
                }
                return parseInt(vExpr, 10);
            };
        f.toString = function () {
            return 'convertToInt(' + expr.toString()  + ')';
        };

        var toSql = function (formatter, context) {
            return formatter.convertToInt(expr, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Converts a generic expression into a string
     * @method convertToString
     * @param {expression} expr1
     * @param {number} maxLen maximum string len
     * @returns {sqlFun}
     */
    function convertToString(expr1, maxLen) {
        var expr = autofield(expr1),
            f = function (r, context) {
                if (r === undefined) {
                    return undefined;
                }
                var vExpr = calc(expr, r, context);
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null) {
                    return null;
                }
                return vExpr.toString().substr(0,maxLen);
            };
        f.toString = function () {
            return 'convertToString(' + expr.toString()+','+maxLen.toString() + ')';
        };

        var toSql = function (formatter, context) {
            return formatter.convertToString(expr, maxLen, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * checks if all supplied expression evaluate to truthy values
     * @method and
     * @param arr {array} array or list of expression
     * @return {sqlFun}
     */
    function and(arr) {
        var a = arr,
            alwaysFalse = false,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        var optimizedArgs = _.filter(a,function(el){
            if (el === undefined) {
                return false;
            }
            if (el===null) {
                return false;
            }
            if (el===true || el.isTrue) {
                return false;
            }
            if (el===false || el.isFalse) {
                alwaysFalse = true;
            }
            return true;
        });

        if (alwaysFalse){
            return constant(false);
        }

        if (optimizedArgs.length === 0){
            return constant(true);
        }

        f = function (r, context) {
            var i;
            var someUndefined = false;
            for (i = 0; i < optimizedArgs.length; i += 1) {
                var x = calc(optimizedArgs[i], r, context);
                if (x === false) {
                    return false;
                }
                if (x === undefined){
                    someUndefined=true;
                }
            }
            if (someUndefined){
                return undefined;
            }
            return true;
        };
        f.toString = function(){
            return 'and('+ arrayToString(a)+')';
        };
        var toSql = function (formatter, context) {
            return formatter.joinAnd(_.map(optimizedArgs, function(v) {
                return formatter.toSql(v, context);
            }));
        };

        return toSqlFun(f,toSql);
    }




    /**
     * Compares a set of keys of an object with an array of values or with fields of another object
     *  values can be an array or an object
     * @method mcmp
     * @param {string[]} keys
     * @param values
     * @param {string} [alias]
     * @return {sqlFun} f(r) = true if :
     *  case values is an array: r[keys[i]] = values[i] for each i=0..keys.length-1
     *  case values is an object: r[keys[i]] = values[keys[i]] for each i=0..keys.length-1
     */
    function mcmp(keys, values, alias) {
        if (keys.length === 0){
            return constant(true);
        }
        var myValues = _.clone(values), //stabilizes input!!
            picked;

        if (_.isArray(values)) {
            picked = values; //_.map(values, function(v) {return formatter.toSql(v, context);});
        } else {
            picked = _.map(keys, function (k) {
                return values[k];
            });
        }

        if (_.contains(picked,null)){
            return constant(false);
        }


        var f = function (r, context) {
            if (r === undefined) {
                return undefined;
            }
            var i, field, value;
            for (i = 0; i < keys.length; i += 1) {
                field = keys[i];
                if (_.isArray(myValues)) {
                    value = calc(myValues[i], r, context);
                } else {
                    value = myValues[field];
                }

                //I comment this section for compatibility with sql version
                //if (isNullOrUndefined(r[field]) && isNullOrUndefined(value)) {
                //continue;
                //}
                if (isNullOrUndefined(r[field]) || isNullOrUndefined(value)) {
                    return false;
                }
                if (r[field] !== value) {
                    return false;
                }
            }
            return true;
        };
        f.toString = function(){
            return 'mcmp('+ arrayToString(keys)+','+ arrayToString(picked)+')';
        };
        var toSql = function (formatter, context) {
            var k, v;

            return formatter.joinAnd(
                _.map(
                    _.zip(keys, picked),
                    function (pair) {
                        k = pair[0];
                        v = pair[1];
                        if (isNullOrUndefined(v)) {
                            return formatter.isNull(field(k, alias));
                        }
                        return formatter.eq(field(k, alias), v);
                    }
                )
            );
        };
        return toSqlFun(f,toSql);
    }

    /**
     * Compares a set of keys of an object with an array of values or with fields of another object
     * @method mcmpLike
     * @param {object}example
     * @return {sqlFun} f(r) = true if  for each non empty field of r:
     *  case field is a string containing a %: r[field] LIKE example[field]
     *  otherwise: r[field] = example[field]
     */

    function mcmpLike(example){
        if (example === null || example===undefined){
            return constant(true);
        }

        var exprArr = [],
            myValues = _.clone(example);

        _.forEach(_.keys(example),function(k){
            if (myValues[k]===undefined || myValues[k]==='' || myValues[k]===null){
                return;
            }
            if (_.isString(myValues[k])){
                exprArr.push(like(k, '%'+myValues[k]+'%'));

            } else {
                exprArr.push(eq(k, myValues[k]));
            }
        });
        return and(exprArr)

    }

    /**
     * returns a functions that evaluates the sum of a list or array of values given when it is CREATED
     * @method sub
     * @param {sqlFun} expr1
     * @param {sqlFun} expr2
     * @return {sqlFun}
     */
    function sub(expr1,expr2) {
        var expr = autofield(expr1),
            f;
        f = function (r, context) {
            var i,
                sub = null;
            if (r===undefined){
                return undefined;
            }
            var x = calc(expr, r, context),y;
            if (x === undefined) {
                return undefined;
            }
            if (x === null) {
                return null;
            }

            y= calc(expr2, r, context);
            if (y === undefined) {
                return undefined;
            }
            if (y === null) {
                return null;
            }
            return x-y;
        };
        f.toString = function(){return expr.toString()+'-'+expr2.toString()};
        var toSql = function (formatter, context) {
            return formatter.sub(expr,expr2,context);
        };
        return toSqlFun(f,toSql);
    }


    /**
     * returns a functions that evaluates the sum of a list or array of values given when it is CREATED
     * @method div
     * @param {sqlFun} expr1
     * @param {sqlFun} expr2
     * @return {sqlFun}
     */
    function div(expr1, expr2) {
        var expr = autofield(expr1),
            f;
        f = function (r, context) {
            var i,
                sub = null;
            if (r === undefined) {
                return undefined;
            }
            var x = calc(expr, r, context),y;
            if (x === undefined) {
                return undefined;
            }
            if (x === null ) {
                return null;
            }
            y = calc(expr2, r, context);
            if (y === undefined) {
                return undefined;
            }
            if (y === null) {
                return null;
            }
            return x / y;
        };
        f.toString = function () {
            return 'div('+expr.toString() + ',' + expr2.toString()+')';
        };
        var toSql = function (formatter, context) {
            return formatter.div(expr, expr2, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * returns a functions that evaluates the sum of a list or array of values given when it is CREATED
     * @method add
     * @param values
     * @return {sqlFun}
     */
    function add(values) {
        var a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function(r, context){
            var i,
                sum=null;
            for (i = 0; i < a.length; i+=1) {
                var x = calc(a[i], r, context);
                if (x === undefined) {
                    return undefined;
                }
                if (sum === null) {
                    sum = x;
                } else {
                    if (x !== null) {
                        sum += x;
                    }
                }
            }
            return sum;
        };
        f.toString = function () {
            return 'add(' + arrayToString(a) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.add(a, context);
        };
        return toSqlFun(f,toSql);
    }

    /**
     * returns a functions that evaluates the concatenation of a list or array of strings given when it is CREATED
     * @method concat
     * @param values
     * @return {sqlFun}
     */
    function concat(values) {
        var a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function (r, context) {
            var i,
                seq = null;
            for (i = 0; i < a.length; i += 1) {
                var x = calc(a[i], r, context);
                if (x === undefined) {
                    return undefined;
                }
                if (seq === null) {
                    seq = x;
                } else {
                    if (x !== null) {
                        seq += x;
                    }
                }
            }
            return seq;
        };
        f.toString = function () {
            return 'concat(' + arrayToString(values)  + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.concat(a, context);
        };
        return toSqlFun(f,toSql);
    }


    /**
     * Evaluates the sum of an array of element given at run time
     * @method sum
     * @param expr1
     * @returns {f}
     */
    function sum(expr1) {
        var expr  = autofield(expr1),
            f = function (values, context) {
                if (values=== undefined){
                    return undefined;
                }
                var a = values;
                if (!_.isArray(a)) {
                    a = [].slice.call(arguments);
                }

                var i,
                    sum = null;
                for (i = 0; i < a.length; i += 1) {
                    var x = calc(expr, a[i], context);
                    if (x === undefined) {
                        return undefined;
                    }
                    if (sum === null) {
                        sum = x;
                    } else {
                        if (x !== null) {
                            sum += x;
                        }
                    }
                }
                return sum;
            };
        f.toString = function () {
            return 'sum(' + expr.toString() + ')';
        };

        f.grouping = true;
        var toSql = function (formatter, context) {
            return formatter.sum(expr,context);
        };

        return toSqlFun(f,toSql);
    }



    /**
     * returns a functions that evaluates the multiply of a list or array of values
     * If some operand is 0, returns the always 0 function
     * @method mul
     * @param values
     * @return {sqlFun}
     */
    function mul(values) {
        var a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function (r, context) {
            var i,
                prod = null,
                someUndefined = false;
            for (i = 0; i < a.length; i += 1) {
                var x = calc(a[i], r, context);
                if (x === undefined) {
                    someUndefined = true;
                } else if (x===0) {
                    return 0;
                } else if (x!==null){
                    if (prod === null){
                        prod = x;
                    } else {
                        prod *= x;
                    }
                }
            }
            if (someUndefined){
                return undefined;
            }
            return prod;
        };

        f.toString = function () {
            return 'mul(' + arrayToString(values) + ')';
        };
        var toSql = function (formatter, context) {
            return formatter.add(_.map(a, function (v) {
                return formatter.toSql(v, context);
            }));
        };
        return toSqlFun(f,toSql);
    }

    function arrayToString(arr){
        return '['+ _.map(arr,function(value){return toString(value);}).join(',')+']';
    }

    var dataQuery = {
        context: context,
        calc: calc,
        add: add,
        concat: concat,
        sub: sub,
        div: div,
        minus: minus,
        mul: mul,
        mcmp: mcmp,
        mcmpLike: mcmpLike,
        isNull: isNull,
        constant: constant,
        and: and,
        or: or,
        field: field,
        eq: eq,
        ne: ne,
        gt: gt,
        ge: ge,
        lt: lt,
        le: le,
        not: not,
        isNullOrEq: isNullOrEq,
        isNullOrGt: isNullOrGt,
        isNullOrGe: isNullOrGe,
        isNullOrLt: isNullOrLt,
        isNullOrLe: isNullOrLe,
        bitClear: bitClear,
        bitSet: bitSet,
        isIn: isIn,
        isNotIn: isNotIn,
        distinctVal: distinctVal,
        distinct: distinct,
        like: like,
        between: between,
        testMask: testMask,
        max: max,
        min: min,
        substring: substring,
        convertToInt: convertToInt,
        convertToString: convertToString,
        sum:sum,
        coalesce: coalesce
    };


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
            }).value();
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
                this.key(t.key.split(','));
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

    /**
     * Provides shim for Ado.net DataSet class
     * @module DataSet
     */

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
            if (row.state === $rowState.added) {
                _.forEach(this.createFields, function (field) {
                    r[field] = env.field(field);
                });
                return;
            }
            if (row.state === $rowState.modified) {
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
                return dataQuery.mcmp(fields,
                    _.map(fields, function(f){
                        return row.getValue(f, $rowVersion.original);})
                );
            }
            return dataQuery.mcmp(_.keys(r), r);
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
            return dataQuery.mcmp(that.childCols,
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
            return dataQuery.mcmp(that.parentCols,
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
            var actualParentTable = ds.tables[this.parentTable];
            return _.filter(actualParentTable.rows, this.getParentsFilter(childRow));
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
                        if (toDel.getRow().rowState !== $rowState.deleted){
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





    var jsDataSet = {
        dataRowState: $rowState,
        dataRowVersion: $rowVersion,
        DataRow : DataRow,
        dataQuery: dataQuery,
        DataTable: DataTable,
        DataSet: DataSet,
        toString: function () {
            return "dataSet Namespace";
        },
        OptimisticLocking: OptimisticLocking,
        myLoDash:_ //for testing purposes
    };


    // Some AMD build optimizers like r.js check for condition patterns like the following:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        // Expose lodash to the global object when an AMD loader is present to avoid
        // errors in cases where lodash is loaded by a script tag and not intended
        // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
        // more details.
        root.jsDataSet = jsDataSet;

        // Define as an anonymous module so, through path mapping, it can be
        // referenced as the "underscore" module.
        define(function() {
            return jsDataSet;
        });
    }
    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    else if (freeExports && freeModule) {
        // Export for Node.js or RingoJS.
        if (moduleExports) {
            (freeModule.exports = jsDataSet).jsDataSet = jsDataSet;
        }
        // Export for Narwhal or Rhino -require.
        else {
            freeExports.jsDataSet = jsDataSet;
        }
    }
    else {
        // Export for a browser or Rhino.
        root.jsDataSet = jsDataSet;
    }
}.call(this,
            (typeof _ === 'undefined')? require('lodash'): _,
            (typeof ObjectObserver === 'undefined') ? require('observe-js') : ObjectObserver
)
);

