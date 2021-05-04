'use strict';
/*globals _ ,  jasmine, jsDataSet, beforeEach, expect, module, it, inject, describe, spyOn, afterEach  */


describe('DataTable module test', function () {
  const dsSpace = jsDataSet,
      DataTable = dsSpace.DataTable,
      $q = jsDataQuery;
  let ds, ds2;

  beforeEach(function () {
    ds = new dsSpace.DataSet('temp');
    ds2 = new dsSpace.DataSet('temp2');
  });

  afterEach(function () {
      ds = null;
      ds2 = null;
  });


  describe('DataTable functions', function () {
    let t;

    beforeEach(function () {
      t = ds.newTable('customer');

    });

    afterEach(function () {
      t = null;
    });

    it('dataTable should be defined', function () {
      expect(t).toBeDefined();
    });

    it('dataTable should have a string name', function () {
      expect(t.name).toEqual(jasmine.any(String));
    });

    it('dataTable should have an object collection (rows)', function () {
      expect(t.rows).toEqual(jasmine.any(Array));
    });

    it('adding object to table should modify collection size', function () {
      t.add({a: 1, b: 2});
      t.add({a: 2, b: 3});
      t.add({a: 2, b: 3});
      expect(t.rows.length).toBe(3);
    });

    it('detaching object to table should modify collection size', function () {
      t.add({a: 1, b: 2});
      t.add({a: 2, b: 3});
      const c = {a: 2, b: 4};
      t.add(c);
      c.getRow().detach();
      expect(t.rows.length).toBe(2);
    });

    it('adding and detaching object does not change object values', function () {
      const c = {a: 2, b: 4};
      t.add(c);
      c.getRow().detach();
      expect(c).toEqual({a: 2, b: 4});
    });

    it('detaching object does not change object values ', function () {
      const c = {a: 2, b: 4};
      t.add(c);
      c.q = 'n';
      c.getRow().detach();
      expect(c).toEqual({a: 2, b: 4, q: 'n'});
    });

    it('detached objects are not linked toDataRow anymore', function () {
      t.add({a: 1, b: 2});
      t.add({a: 2, b: 3});
      const c = {a: 2, b: 4};
      t.add(c);
      c.getRow().detach();
      expect(c.getRow).toBeUndefined();
    });


    it('adding object are given a state of added', function () {
      const o1 = {a: 1, b: 2},
          o2 = {a: 2, b: 3};
      t.add(o1);
      t.load(o2);
      t.add({a: 2, b: 4});
      t.add({a: 2, b: 3});
      expect(o1.getRow().state).toBe(dsSpace.dataRowState.added);
    });

    it('loaded object are given a state of unchanged', function () {
      const o1 = {a: 1, b: 2},
          o2 = {a: 2, b: 3};
      t.add(o1);
      t.load(o2);
      t.add({a: 2, b: 4});
      t.add({a: 2, b: 3});
      expect(o2.getRow().state).toBe(dsSpace.dataRowState.unchanged);
    });


    it('deleting objects should not modify collection size', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.add({a: 2, b: 3});
      t.add({a: 2, b: 3});
      t.acceptChanges();
      o1.getRow().del();
      expect(t.rows.length).toBe(3);
    });

    it('deleting objects should modify collection size after acceptChanges', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.load({a: 2, b: 3});
      t.add({a: 2, b: 3});
      t.acceptChanges();
      o1.getRow().del();
      t.acceptChanges();
      expect(t.rows.length).toBe(2);
    });

    it('deleted rows becomes detached after acceptChanges', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.load({a: 2, b: 3});
      t.add({a: 2, b: 3});
      t.acceptChanges();
      const dr = o1.getRow();
      dr.del();
      t.acceptChanges();
      expect(dr.state).toBe(dsSpace.dataRowState.detached);
    });

    it('objects are no longer linked to datarow when those have been detached', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.load({a: 2, b: 3});
      t.add({a: 2, b: 3});
      t.acceptChanges();
      const dr = o1.getRow();
      dr.del();
      t.acceptChanges();
      expect(o1.getRow).toBeUndefined();
    });

    it('datarows haven\'t any getRow method  when  detached', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.load({a: 2, b: 3});
      t.add({a: 2, b: 3});
      t.acceptChanges();
      let gr = o1.getRow;
      expect(gr).toBeDefined();

      let dr = o1.getRow();
      expect(dr).toBeDefined();

      dr.del();
      t.acceptChanges();
      expect(dr.getRow).toBeUndefined();
    });


    it('multiple addition of same object should be ignored', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      t.add(o1);
      t.add(o1);
      expect(t.rows.length).toBe(3);
    });


    it('after acceptChanges no modification are left (update-rejectChanges)', function () {
      const o3 = {a: 1, b: 3};
      t.add(o3);
      t.acceptChanges();
      o3.a=2;
      t.rejectChanges();
      expect(t.hasChanges()).toBeFalsy();
      expect(o3.getRow().state).toBe(dsSpace.dataRowState.unchanged);
    });

    it('after rejectChanges no modification are left (add-acceptChanges)', function () {
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o2);
      t.add(o3);
      t.acceptChanges();
      t.add({a: 3, c: 5});
      t.rejectChanges();
      expect(t.hasChanges()).toBeFalsy();
    });

    it('after rejectChanges no modification are left (del-acceptChanges)', function () {
      const o1 = {a: 1, b: 2};
      t.add(o1);
      t.acceptChanges();
      o1.getRow().del();
      t.add({a: 3, c: 5});
      t.rejectChanges();
      expect(t.hasChanges()).toBeFalsy();
    });


    it('rejectChanges should undo deletions', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      t.acceptChanges();
      o1.getRow().del();
      t.rejectChanges();
      expect(o1.getRow().state).toBe(dsSpace.dataRowState.unchanged);
      expect(t.rows.length).toBe(3);
    });

    it('rejectChanges should undo additions', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      t.acceptChanges();
      const o4 = {k: 1};
      t.add(o4);
      t.rejectChanges();
      expect(o4.getRow).toBeUndefined();
      expect(t.rows.length).toBe(3);
    });

    it('getChanges should contain added rows', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      t.acceptChanges();
      const o4 = {k: 1};
      const p4 = t.add(o4).current;
      expect(t.getChanges().indexOf(p4)).toBeGreaterThan(-1);
    });

    it('getChanges should contain deleted rows', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      const p3 = t.add(o3).current;
      t.acceptChanges();
      //o3.getRow().del();
      p3.$del();
      expect(t.getChanges().indexOf(p3)).toBeGreaterThan(-1);
    });

    it('getChanges should contain modified rows', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      const p1 = t.add(o1).current;
      const p2 = t.add(o2).current;
      const p3 = t.add(o3).current;
      t.acceptChanges();
      p3.c = 'a';
      p2.a = 2;
      const qq1 = t.getChanges();
      expect(t.getChanges().indexOf(p3)).toBeGreaterThan(-1);
      expect(t.getChanges().indexOf(p2)).toBeGreaterThan(-1);
    });

    it('getChanges should not contain false updates', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3};
      const o3 = {a: 1, b: 3};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      t.acceptChanges();
      o2.a = 1;
      o1.a = 2;
      o1.a = 1;
      o1.a1 = 0;
      delete o1.a1;
      expect(t.getChanges().indexOf(o2)).toBe(-1);
      expect(t.getChanges().indexOf(o1)).toBe(-1);
    });

    it('key should be a function', function () {
      expect(t.key).toEqual(jasmine.any(Function));
    });

    it('key() should return an array', function () {
      expect(t.key()).toEqual(jasmine.any(Array));
    });


    it('key(args) should set Table key', function () {
      t.key(['a', 'b', 'c']);
      expect(t.key()).toEqual(['a', 'b', 'c']);
    });

    it('select with null as filter should return all rows', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3, c: 4};
      const o3 = {a: 1, b: 3, c: 2};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      expect(t.select(null)).toEqual([o1,o2,o3]);

    });

    it('select should return matching rows', function () {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 3, c: 4};
      const o3 = {a: 1, b: 3, c: 2};
      t.add(o1);
      t.add(o2);
      t.add(o3);
      expect(t.select($q.eq('b', 3)).length).toBe(2);
      expect(t.select($q.eq('c', 2)).length).toBe(1);
    });

    it('defaults should be a function', function () {
      expect(t.defaults).toEqual(jasmine.any(Function));
    });


    it('newRow should be a function', function () {
      expect(t.newRow).toEqual(jasmine.any(Function));
    });
    it('newRow should return an object', function () {
      expect(t.newRow()).toEqual(jasmine.any(Object));
    });

    it('The object returned by newRow should have a dataRow', function () {
      expect(t.newRow().getRow()).toEqual(jasmine.any(dsSpace.DataRow));
    });


    it('after calling defaults(values), new Row has defaults', function () {
      t.defaults({L: 1, a: 'john'});
      const n = t.newRow();
      expect(n.L).toBe(1);
      expect(n.a).toBe('john');
    });

    it('successive defaults(values) merge their values', function () {
      t.defaults({L: 1, a: 'john'});
      t.defaults({L: 2, b: 'mary'});
      const n = t.newRow();
      expect(n.L).toBe(2);
      expect(n.a).toBe('john');
      expect(n.b).toBe('mary');
    });

    it('after calling clearDefaults, new Row has NO defaults', function () {
      t.defaults({L: 1, a: 'john'});
      t.newRow();
      t.clearDefaults({});
      const n1 = t.newRow();
      expect(n1.L).toBeUndefined();
      expect(n1.a).toBeUndefined();
      expect(n1.b).toBeUndefined();

    });
    it('newRow(o) should have o values where o is given', function () {
      const o = {L: 1, a: 'hi'};
      const n = t.newRow(o);
      expect(n).toEqual(o);
    });

    it('newRow(o) should have default  values where not overridden by o ', function () {
      const o = {L: 1, a: 'hi'};
      t.defaults({B: 1, a: 'no'});
      const n = t.newRow(o);
      const c = {L: 1, B: 1, a: 'hi'};
      expect(n).toEqual(c);
    });

    it('DataRow modification created with newRow does not affect original object', function () {
      const o = {a: 1};
      const p = t.newRow(o);
      p.a = 2;
      expect(o.a).toBe(1);
    });

    it('changing defaults does not change rows', function () {
      const o = {L: 1, a: 'hi'};
      t.defaults({B: 1, a: 'no'});
      const n = t.newRow(o);
      t.defaults({B: 2, a: 'yes'});
      const c = {L: 1, B: 1, a: 'hi'};
      expect(n).toEqual(c);
    });

    it('loaded rows should be in unchanged state', function () {
      const o = {L: 1, a: 'hi'};
      const r = t.load(o);
      expect(r.state).toBe(dsSpace.dataRowState.unchanged);
    });

    it('false changes should leave state unchanged', function () {
      const o = {L: 1, a: 'hi'};
      const r = t.load(o);
      o.L = 2;
      o.L = 1;
      expect(r.state).toBe(dsSpace.dataRowState.unchanged);
    });

    it('loaded array of rows should be in unchanged state', function () {
      t.acceptChanges();
      const a = [
        {L: 1, a: 'hi'},
        {L: 2, a: 'ho'}
      ];
      t.loadArray(a);
      expect(t.hasChanges()).toBeFalsy();
    });

    it('default value of tableForReading should be table name', function(){
      expect(t.tableForReading()).toBe('customer');
    });

    it('default value of tableForWriting should be table name', function () {
      expect(t.tableForWriting()).toBe('customer');
    });

    it('setting  tableForReading does not change table name', function () {
      t.tableForReading('customer2');
      expect(t.tableForReading()).toBe('customer2');
      expect(t.name).toBe('customer');
    });

    it('setting  tableForWriting does not change table name', function () {
      t.tableForWriting('customer2');
      expect(t.tableForWriting()).toBe('customer2');
      expect(t.name).toBe('customer');
    });

    it('cloning should preserve tableForReading, tableForWriting, autoIncrementColumns', function () {
      t.tableForWriting('customer2');
      t.tableForReading('customer3');
      t.autoIncrement('idoperatore',{});
      const t2 = t.clone();
      expect(t2.tableForWriting()).toBe('customer2');
      expect(t2.tableForReading()).toBe('customer3');
      expect(t2.autoIncrement('idoperatore').columnName).toEqual('idoperatore');
      expect(t2.name).toBe('customer');
    });

    it("sortRows should return a sorted copy of given rows", function(){
      let rows=[{a:1,b:1,c:1},{a:2,b:10,c:3},{a:2,b:2,c:1},{a:3,b:2,c:4}];
      let t = new  DataTable();
      let s1 = t.sortRows(rows,"a");
      expect(s1.length).toBe(4);
      expect(s1[0].a).toBe(1);
      expect(s1[1].a).toBe(2);
      expect(s1[2].a).toBe(2);
      expect(s1[3].a).toBe(3);

      s1 = t.sortRows(rows,"a desc");
      expect(s1.length).toBe(4);
      expect(s1[0].a).toBe(3);
      expect(s1[1].a).toBe(2);
      expect(s1[2].a).toBe(2);
      expect(s1[3].a).toBe(1);

      s1 = t.sortRows(rows,"b desc, a");
      expect(s1.length).toBe(4);
      expect(s1[0].b).toBe(10);
      expect(s1[0].a).toBe(2);

      expect(s1[1].b).toBe(2);
      expect(s1[1].a).toBe(2);

      expect(s1[2].b).toBe(2);
      expect(s1[2].a).toBe(3);

      expect(s1[3].b).toBe(1);
      expect(s1[3].a).toBe(1);


    });

  });

  describe('autoIncrement functions', function () {
    let t;

    beforeEach(function () {
      t = ds.newTable('customer');

    });

    afterEach(function () {
      t = null;
    });


    it('should define setOptimized', function(){
      expect(t.setOptimized).toEqual(jasmine.any(Function));
    });

    it('should define isOptimized', function () {
      expect(t.isOptimized).toEqual(jasmine.any(Function));
    });

    it('should define clearMaxCache', function () {
      expect(t.clearMaxCache).toEqual(jasmine.any(Function));
    });

    it('should define setMaxExpr', function () {
      expect(t.setMaxExpr).toEqual(jasmine.any(Function));
    });

    it('should define minimumTempValue', function () {
      expect(t.minimumTempValue).toEqual(jasmine.any(Function));
    });

    it('should define getMaxExpr', function () {
      expect(t.getMaxExpr).toEqual(jasmine.any(Function));
    });

    it('isOptimized should describe the state of Optimized', function(){
      expect(t.isOptimized()).toBeFalsy();
      t.setOptimized(false);
      expect(t.isOptimized()).toBeFalsy();
      t.setOptimized(true);
      expect(t.isOptimized()).toBeTruthy();
      t.setOptimized(false);
      expect(t.isOptimized()).toBeFalsy();
    });

    it('clearMaxCache should not change the state of Optimized', function(){
      expect(t.isOptimized()).toBeFalsy();
      t.clearMaxCache();
      expect(t.isOptimized()).toBeFalsy();
      t.setOptimized(true);
      expect(t.isOptimized()).toBeTruthy();
      t.clearMaxCache();
      expect(t.isOptimized()).toBeTruthy();
      t.setOptimized(false);
      expect(t.isOptimized()).toBeFalsy();
      t.clearMaxCache();
      expect(t.isOptimized()).toBeFalsy();
    });

    it('minimumTempValue should get/set minimum value admitted for a field', function(){
      expect(t.minimumTempValue('a')).toBe(0);
      t.minimumTempValue('a',2);
      expect(t.minimumTempValue('a')).toBe(2);
      t.minimumTempValue('a', null);
      expect(t.minimumTempValue('a')).toBe(0);
      t.minimumTempValue('a', 3);
      expect(t.minimumTempValue('a')).toBe(3);
    });

    it('getMaxExpr should throw  when table is not optimized', function () {
      const f = function () {
        t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014));
      };
      expect(f).toThrow();
    });

    it('getMaxExpr should give values when set by setMaxExpr, 0 otherwise', function(){
      t.setOptimized(true);
      expect(t.getMaxExpr('a', $q.max('id'),$q.eq('year',2014))).toBe(0);
      t.setMaxExpr('a', $q.max('id'), $q.eq('year', 2014),12);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(12);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2012))).toBe(0);
      t.setMaxExpr('a', $q.max('id'), $q.eq('year', 2012), 11);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2012))).toBe(11);
      expect(t.getMaxExpr('a', $q.max('ID'), $q.eq('year', 2014))).toBe(0);
      expect(t.getMaxExpr('A', $q.max('id'), $q.eq('year', 2014))).toBe(0);
      t.setMaxExpr('a', $q.max('id'), $q.eq('year', 2014), 12);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(12);
      t.setMaxExpr('a', $q.max('id'), $q.eq('year', 2014), 99);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(99);
    });

    it('clearMaxCache should clear cached values', function () {
      t.setOptimized(true);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(0);
      t.setMaxExpr('a', $q.max('id'), $q.eq('year', 2014), 12);
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(12);
      t.clearMaxCache();
      expect(t.getMaxExpr('a', $q.max('id'), $q.eq('year', 2014))).toBe(0);
    });

    it('should define unCachedMaxSubstring', function () {
      expect(t.unCachedMaxSubstring).toEqual(jasmine.any(Function));
    });

    it('should define cachedMaxSubstring', function () {
      expect(t.cachedMaxSubstring).toEqual(jasmine.any(Function));
    });

    it('unCachedMaxSubstring should give max of column when start and len are zero', function(){
      t.newRow({a:1});
      t.newRow({a: 10});
      t.newRow({a: 5});
      t.newRow({a: 4});
      expect(t.unCachedMaxSubstring('a',0,0,null)).toBe(10);
    });

    it('unCachedMaxSubstring should give max of column when start and len are zero', function () {
      t.newRow({a: 1});
      t.newRow({b: 10});
      t.newRow({a: 5});
      t.newRow({a: 4});
      expect(t.unCachedMaxSubstring('a', 0, 0, null)).toBe(5);
    });

    it('unCachedMaxSubstring should give filtered max of column when start and len are zero', function () {
      t.newRow({a: 1,b:1});
      t.newRow({a:2, b: 10});
      t.newRow({a: 5, b:0});
      t.newRow({a: 40});
      t.newRow({a: 4,b:0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10,b:2});
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b',0))).toBe(5);
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(2);
    });

    it('unCachedMaxSubstring should consider deleted rows', function () {
      const o1 = t.newRow({a: 100, b: 0}),
          o2 = t.newRow({a: 20, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.acceptChanges();
      o1.getRow().del();
      o2.getRow().del();
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(20);
    });

    it('unCachedMaxSubstring should take substring when start,len are given', function () {
      const o1 = t.newRow({a: '000100', b: 0}),
          o2 = t.newRow({a: '001101', b: 10});
      t.newRow({a: '001302', b: 0});
      t.newRow({a: '401212'});
      t.newRow({a: '172182', b: 0});
      t.newRow({a: '123456', b: 10});
      t.newRow({a: '654321', b: 2});
      t.acceptChanges();
      o1.getRow().del();
      o2.getRow().del();
      expect(t.unCachedMaxSubstring('a', 3, 2, $q.eq('b', 0))).toBe(21);
      expect(t.unCachedMaxSubstring('a', 3, 2, $q.eq('b', 10))).toBe(34);
    });

    it('unCachedMaxSubstring should take substring from start where len is greater than string length', function () {
      const o1 = t.newRow({a: '000100', b: 0}),
          o2 = t.newRow({a: '001101', b: 10});
      t.newRow({a: '001302', b: 0});
      t.newRow({a: '401212'});
      t.newRow({a: '172182', b: 0});
      t.newRow({a: '123456', b: 10});
      t.newRow({a: '654321', b: 2});
      t.acceptChanges();
      o1.getRow().del();
      o2.getRow().del();
      expect(t.unCachedMaxSubstring('a', 3, 10, $q.eq('b', 0))).toBe(2182);
      expect(t.unCachedMaxSubstring('a', 3, 10, $q.eq('b', 10))).toBe(3456);
    });

    it('unCachedMaxSubstring should give null/undefined if start or len are null/undefined', function () {
      const o1 = t.newRow({a: '000100', b: 0}),
          o2 = t.newRow({a: '001101', b: 10});
      t.newRow({a: '001302', b: 0});
      t.newRow({a: '401212'});
      t.newRow({a: '172182', b: 0});
      t.newRow({a: '123456', b: 10});
      t.newRow({a: '654321', b: 2});
      t.acceptChanges();
      o1.getRow().del();
      o2.getRow().del();
      expect(t.unCachedMaxSubstring('a', 3, null, $q.eq('b', 0))).toBe(null);
      expect(t.unCachedMaxSubstring('a', 3, undefined, $q.eq('b', 10))).toBe(undefined);
    });

    it('unCachedMaxSubstring should give 0 when no row matches filter', function () {
      const o1 = t.newRow({a: '000100', b: 0}),
          o2 = t.newRow({a: '001101', b: 10});
      t.newRow({a: '001302', b: 0});
      t.newRow({a: '401212'});
      t.newRow({a: '172182', b: 0});
      t.newRow({a: '123456', b: 10});
      t.newRow({a: '654321', b: 2});
      t.acceptChanges();
      o1.getRow().del();
      o2.getRow().del();
      expect(t.unCachedMaxSubstring('a', 3, 10, $q.eq('b', 99))).toBe(0);
    });

    it('unCachedMaxSubstring should give values greater than minimumValue set', function () {
      t.newRow({a: 1, b: 1});
      t.newRow({a: 2, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.minimumTempValue('a',100);
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(100);
      expect(t.unCachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(100);
    });

    it('cachedMaxSubstring should give values greater than minimumValue set', function () {
      t.newRow({a: 1, b: 1});
      t.newRow({a: 2, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.minimumTempValue('a', 100);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(100);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(100);
    });

    it('cachedMaxSubstring should call unCachedMaxSubstring when not optimized', function () {
      t.newRow({a: 1, b: 1});
      t.newRow({a: 2, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.minimumTempValue('a', 100);
      spyOn(t, 'unCachedMaxSubstring').and.callThrough();
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(1);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(2);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(3);
    });

    it('cachedMaxSubstring should never call unCachedMaxSubstring when is optimized', function () {
      t.setOptimized(true);
      t.newRow({a: 1, b: 1});
      t.newRow({a: 2, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.minimumTempValue('a', 100);
      spyOn(t, 'unCachedMaxSubstring').and.callThrough();
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(102);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);

      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);

      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
    });

    it('cachedMaxSubstring should never call unCachedMaxSubstring when is optimized', function () {
      t.setOptimized(true);
      t.newRow({a: 1, b: 1});
      t.newRow({a: 2, b: 10});
      t.newRow({a: 5, b: 0});
      t.newRow({a: 40});
      t.newRow({a: 4, b: 0});
      t.newRow({a: -30, b: 10});
      t.newRow({a: 10, b: 2});
      t.minimumTempValue('a', 100);
      spyOn(t, 'unCachedMaxSubstring').and.callThrough();
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 0))).toBe(102);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);

      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 10))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);

      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(100);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
      expect(t.cachedMaxSubstring('a', 0, 0, $q.eq('b', 999))).toBe(101);
      expect(t.unCachedMaxSubstring.calls.count()).toBe(0);
    });



  });

  describe('newRow', function () {
    beforeEach(function () {
      const tableA = ds.newTable('a'),
          tableB = ds.newTable('b'),
          tableC = ds.newTable('c'),
          tableD = ds.newTable('d');
      tableA.key('idA');
      tableB.key('idA', 'idB');
      tableC.key('idA', 'idB', 'idC');
      tableD.key('idD');
      tableA.defaults({g0:0,g1:1,g2:2});
      tableA.autoIncrement('idA', {});
      tableB.autoIncrement('idB', {selector: ['idA'],idLen:5});
      tableC.autoIncrement('idC', {selector: ['idA','idB']});
      ds.newRelation('ab', 'a', 'idA', 'b', 'idA');
      ds.newRelation('bc', 'b', 'idA,idB', 'c', 'idA,idB');
    });

    it ('should assign defaults when those are present', function(){
      const rA = ds.tables.a.newRow();
      expect(rA.g0).toBe(0);
      expect(rA.g1).toBe(1);
      expect(rA.g2).toBe(2);
    });

    it('should call calcTemporaryId ', function () {
      spyOn(ds.tables.a,'calcTemporaryId').and.callThrough();
      const rA = ds.tables.a.newRow();
      expect(ds.tables.a.calcTemporaryId).toHaveBeenCalled();
    });
    it('should call makeChild ', function () {
      spyOn(ds.tables.b, 'makeChild').and.callThrough();
      const rA = ds.tables.a.newRow(),
          rB = ds.tables.b.newRow({}, rA);
      expect(ds.tables.b.makeChild).toHaveBeenCalled();
      expect(rB.idB).toBe('00001');

    });

    it('should evaluate autoincrement fields on simple case', function () {
      const rA = ds.tables.a.newRow();
      expect(rA.idA).toBe(1);
      const rB = ds.tables.b.newRow();
      expect(rB.idA).toBeUndefined();
      expect(rB.idB).toBe('00001');
      const rB2 = ds.tables.b.newRow({}, rA);
      expect(rB2.idA).toBe(1);
      expect(rB2.idB).toBe('00001');
      const rB3 = ds.tables.b.newRow({}, rA);
      expect(rB3.idA).toBe(1);
      expect(rB3.idB).toBe('00002');
      const rB4 = ds.tables.b.newRow({}, rA);
      expect(rB4.idA).toBe(1);
      expect(rB4.idB).toBe('00003');
      const rC1 = ds.tables.c.newRow({}, rB4);
      expect(rC1.idA).toBe(1);
      expect(rC1.idB).toBe('00003');
      expect(rC1.idC).toBe(1);
      const rC2 = ds.tables.c.newRow({}, rB4);
      expect(rC2.idA).toBe(1);
      expect(rC2.idB).toBe('00003');
      expect(rC2.idC).toBe(2);
      const rC3 = ds.tables.c.newRow({}, rB3);
      expect(rC3.idA).toBe(1);
      expect(rC3.idB).toBe('00002');
      expect(rC3.idC).toBe(1);
    });

    it('should evaluate autoincrement fields on complex case (prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e','e',['idE'],'e','parIdE');
      tableE.key('idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6});
      const rE1 = tableE.newRow({});
      expect(rE1.idE).toBe('14000001');
      const rE2 = tableE.newRow({}, rE1);
      expect(rE2.parIdE).toBe('14000001');
      expect(rE2.idE).toBe('1400000114000001');
      const rE3 = tableE.newRow({}, rE1);
      expect(rE3.parIdE).toBe('14000001');
      expect(rE3.idE).toBe('1400000114000002');
      const rE4 = tableE.newRow({}, rE1);
      expect(rE4.parIdE).toBe('14000001');
      expect(rE4.idE).toBe('1400000114000003');
      const rE5 = tableE.newRow({}, rE2);
      expect(rE5.parIdE).toBe('1400000114000001');
      expect(rE5.idE).toBe('140000011400000114000001');
      const rE6 = tableE.newRow({}, rE2);
      expect(rE6.parIdE).toBe('1400000114000001');
      expect(rE6.idE).toBe('140000011400000114000002');
    });

    it('should evaluate autoincrement fields on more complex case (selectors, prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['idE'], 'e', 'parIdE');
      tableE.key('ayear','idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6, selector:['ayear']});
      tableE.defaults({ayear:2014});
      const rE1 = tableE.newRow({});
      expect(rE1.idE).toBe('14000001');
      expect(rE1.ayear).toBe(2014);

      const rE1bis = tableE.newRow({ayear: 2015});
      expect(rE1bis.idE).toBe('14000001');
      expect(rE1bis.ayear).toBe(2015);

      const rE2 = tableE.newRow({}, rE1);
      expect(rE2.parIdE).toBe('14000001');
      expect(rE2.idE).toBe('1400000114000001');

      const rE2bis = tableE.newRow({ayear: 2015}, rE1bis);
      expect(rE2bis.parIdE).toBe('14000001');
      expect(rE2bis.idE).toBe('1400000114000001');

      const rE2ter = tableE.newRow({ayear: 2014}, rE1bis);
      expect(rE2ter.ayear).toBe(2014);
      expect(rE2ter.parIdE).toBe('14000001');
      expect(rE2ter.idE).toBe('1400000114000002');

      const rE2quater = tableE.newRow({ayear: 2014}, rE1bis);
      expect(rE2quater.ayear).toBe(2014);
      expect(rE2quater.parIdE).toBe('14000001');
      expect(rE2quater.idE).toBe('1400000114000003');


      const rE3 = tableE.newRow({}, rE1);
      expect(rE3.parIdE).toBe('14000001');
      expect(rE3.idE).toBe('1400000114000004');
      const rE4 = tableE.newRow({}, rE1);
      expect(rE4.parIdE).toBe('14000001');
      expect(rE4.idE).toBe('1400000114000005');
      const rE5 = tableE.newRow({}, rE2);
      expect(rE5.parIdE).toBe('1400000114000001');
      expect(rE5.idE).toBe('140000011400000114000001');
      const rE6 = tableE.newRow({}, rE2);
      expect(rE6.parIdE).toBe('1400000114000001');
      expect(rE6.idE).toBe('140000011400000114000002');
    });
  });

  describe('assignField', function(){
    beforeEach(function(){
      const tableA = ds.newTable('a'),
          tableB = ds.newTable('b'),
          tableC = ds.newTable('c'),
          tableD = ds.newTable('d');
      tableA.key('idA');
      tableB.key('idA', 'idB');
      tableC.key('idA', 'idB', 'idC');
      tableD.key('idD');
      tableA.defaults({g0: 0, g1: 1, g2: 2});
      tableA.autoIncrement('idA', {});
      tableB.autoIncrement('idB', {selector: ['idA'], idLen: 5});
      tableC.autoIncrement('idC', {selector: ['idA', 'idB']});
      ds.newRelation('ab', 'a', 'idA', 'b', 'idA');
      ds.newRelation('bc', 'b', 'idA,idB', 'c', 'idA,idB');
    });

    it ('should assign simple fields', function(){
      const rowD = ds.tables.d.newRow({x: 10, y: 20}),
          rowA = ds.tables.d.newRow({x: 20, y: 30});
      ds.tables.d.assignField(rowD,'idD',5);
      expect(rowD.idD).toBe(5);
      ds.tables.d.assignField(rowA, 'idA', 1);
      expect(rowA.idA).toBe(1);
    });

    it('should call cascadeAssignField', function () {
      spyOn(ds.tables.d,'cascadeAssignField').and.callThrough();
      const rowD = ds.tables.d.newRow({x: 10, y: 20}),
          rowA = ds.tables.d.newRow({x: 20, y: 30});
      ds.tables.d.assignField(rowD, 'idD', 5);
      expect(rowD.idD).toBe(5);
      expect(ds.tables.d.cascadeAssignField.calls.count()).toEqual(1);
      ds.tables.d.assignField(rowA, 'idA', 1);
      expect(rowA.idA).toBe(1);
      expect(ds.tables.d.cascadeAssignField.calls.count()).toEqual(2);
    });


    it('should cascade assign fields (simple case)', function (){
      const rA = ds.tables.a.newRow();  //idA = 1

      const rB = ds.tables.b.newRow(); //idA undefined idB 00001

      const rB2 = ds.tables.b.newRow({}, rA);//idA 1  idB 00001
      const rB3 = ds.tables.b.newRow({}, rA);//idA 1  idB 00002
      const rB4 = ds.tables.b.newRow({}, rA);//idA 1  idB 00003
      const rC1 = ds.tables.c.newRow({}, rB4);//idA 1 idB 00003 idC 1
      const rC2 = ds.tables.c.newRow({}, rB4);//idA 1 idB 00003 idC 2
      const rC3 = ds.tables.c.newRow({}, rB3);//idA 1 idB 00002 idC 1
      expect(rC3.idB).toBe('00002');
      ds.tables.b.assignField(rB3, 'idB', '00005');
      expect(rB3.idB).toBe('00005');
      expect(rC3.idB).toBe('00005');

      ds.tables.b.assignField(rB4, 'idB', '00006');
      expect(rB4.idB).toBe('00006');
      expect(rC1.idB).toBe('00006');
      expect(rC2.idB).toBe('00006');
    });

    it('should cascade assign fields on complex case (prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['idE'], 'e', 'parIdE');
      tableE.key('idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6});
      const rE1 = tableE.newRow({});       //idE 14000001
      const rE2 = tableE.newRow({}, rE1);  //idE 1400000114000001 parIdE 14000001
      const rE3 = tableE.newRow({}, rE1);  //idE 1400000114000002 parIdE 14000001
      const rE4 = tableE.newRow({}, rE1);  //idE 1400000114000003 parIdE 14000001
      const rE5 = tableE.newRow({}, rE2);  //idE 140000011400000114000001  parIdE 1400000114000001
      const rE6 = tableE.newRow({}, rE2);  //idE 140000011400000114000002  parIdE 1400000114000001

      expect(rE2.idE).toBe('1400000114000001');
      tableE.assignField(rE1,'idE', '14000104');
      expect(rE2.idE).toBe('1400010414000001');
      expect(rE3.idE).toBe('1400010414000002');
      expect(rE4.idE).toBe('1400010414000003');
      expect(rE5.idE).toBe('140001041400000114000001');
      expect(rE6.idE).toBe('140001041400000114000002');
    });

    it('should cascade assign fields on complex case (linear) (prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['idE'], 'e', 'parIdE');
      tableE.key('idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6, linearField:true});
      const rE1 = tableE.newRow({});       //idE 14000001
      const rE2 = tableE.newRow({}, rE1);  //idE 1400000114000001 parIdE 14000001
      const rE3 = tableE.newRow({}, rE1);  //idE 1400000114000002 parIdE 14000001
      const rE4 = tableE.newRow({}, rE1);  //idE 1400000114000003 parIdE 14000001
      const rE5 = tableE.newRow({}, rE2);  //idE 140000011400000114000001  parIdE 1400000114000001
      const rE6 = tableE.newRow({}, rE2);  //idE 140000011400000114000002  parIdE 1400000114000001

      expect(rE2.idE).toBe('1400000114000001');
      tableE.assignField(rE1, 'idE', '14000104');
      expect(rE2.idE).toBe('1400010414000004');
      expect(rE3.idE).toBe('1400010414000005');
      expect(rE4.idE).toBe('1400010414000006');
      expect(rE5.idE).toBe('140001041400000414000003');
      expect(rE6.idE).toBe('140001041400000414000004');
    });


    it('should evaluate autoincrement fields on more complex case (selectors, prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['ayear','idE'], 'e', ['ayear','parIdE']);
      tableE.key('ayear', 'idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6, selector: ['ayear']});
      tableE.defaults({ayear: 2014});
      const rE1 = tableE.newRow({});                         //ayear 2014 idE 14000001
      const rE1bis = tableE.newRow({ayear: 2015});           //ayear 2015 idE 14000001
      const rE2 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000001  parIdE  14000001
      const rE2bis = tableE.newRow({ayear: 2015}, rE1bis);   //ayear 2015 idE 1400000114000001  parIdE  14000001
      const rE2ter = tableE.newRow({ayear: 2014}, rE1bis);   //ayear 2015 idE 1400000114000002  parIdE  14000001
      const rE2quater = tableE.newRow({ayear: 2014}, rE1bis);//ayear 2015 idE 1400000114000003  parIdE  14000001
      const rE3 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000002  parIdE  14000001
      const rE4 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000003  parIdE  14000001
      const rE5 = tableE.newRow({}, rE2);     //ayear 2014 idE 140000011400000114000001  parIdE  1400000114000001
      const rE6 = tableE.newRow({}, rE2);     //ayear 2014 idE 140000011400000114000002  parIdE  1400000114000001
      expect(rE2ter.ayear).toBe(2015);
      expect(rE2quater.ayear).toBe(2015);
      expect(rE2quater.idE).toBe('1400000114000003');
      expect(rE3.idE).toBe('1400000114000002');
      expect(rE4.idE).toBe('1400000114000003');
      expect(rE5.idE).toBe('140000011400000114000001');
      expect(rE6.idE).toBe('140000011400000114000002');
      tableE.assignField(rE1,'idE','14000999'); //ayear 2014 idE 14000999
      expect(rE1bis.idE).toBe('14000001'); //should not change cause is not a child
      expect(rE2.idE).toBe('1400099914000001');
      expect(rE2bis.idE).toBe('1400000114000001'); //should not change cause has a different selector
      expect(rE2ter.idE).toBe('1400000114000002'); //should change cause parent is changed
      expect(rE2quater.idE).toBe('1400000114000003'); //should change cause parent is changed
      expect(rE3.idE).toBe('1400099914000002'); //should change cause parent is changed
      expect(rE4.idE).toBe('1400099914000003'); //should change cause parent is changed
      expect(rE5.idE).toBe('140009991400000114000001'); //should change cause parent is changed
      expect(rE6.idE).toBe('140009991400000114000002'); //should change cause parent is changed

    });
  });

  describe('getSelector', function(){
    let t, auto, auto2, auto3;
    beforeEach(function(){
      t = ds.newTable('a');
      t.autoIncrement('id',{selector:['y','n']});
      t.autoIncrement('id2', {selector: []});
      t.autoIncrement('id3', {selector: ['y','n'], selectorMask:[0xff,0x0F]});
      auto = t.autoIncrement('id');
      auto2 = t.autoIncrement('id2');
      auto3 = t.autoIncrement('id3');
    });

    it('should return a function', function () {
      expect(auto.getSelector({y:2010,n:1})).toEqual(jasmine.any(Function));
    });

    it ('returned function should compare all fields in autoIncrementProperty.selector', function(){
      const r1 = t.newRow({a: 1, b: 2, y: 2014, n: 1}),
          r2 = t.newRow({a: 2, b: 2, y: 2014, n: 1}),
          r3 = t.newRow({a: 3, b: 2, y: 2014, n: 2}),
          r4 = t.newRow({a: 4, b: 2, y: 2014, n: 3}),
          r5 = t.newRow({a: 5, b: 2, y: 2014, n: 3}),
          r6 = t.newRow({a: 6, b: 2, y: 2014, n: 4}),
          r7 = t.newRow({a: 2, b: 2, y: 2015, n: 1}),
          r8 = t.newRow({a: 3, b: 2, y: 2015, n: 2}),
          r9 = t.newRow({a: 4, b: 2, y: 2015, n: 3});
      const f = auto.getSelector({a: 12, b: 15, y: 2014, n: 3});
      expect(t.select(f)).toEqual([r4,r5]);
      const f2 = auto.getSelector({a: 13, b: 20, y: 2014, n: 1});
      expect(t.select(f2)).toEqual([r1,r2]);
      const f3 = auto.getSelector({a: 13, b: 20, y: 2014}, auto);
      expect(t.select(f3)).toEqual([]);
      const f4 = auto.getSelector({a: 13, b: 20});
      expect(t.select(f4)).toEqual([]);
      const f6 = auto3.getSelector({a: 13, b: 20, y: 2014, n: 1});
      expect(t.select(f6)).toEqual([r1,r2]);

    });

    it ('empty selector means no filter', function(){
      const r1 = t.newRow({a: 1, b: 2, y: 2014, n: 1}),
          r2 = t.newRow({a: 2, b: 2, y: 2014, n: 1}),
          r3 = t.newRow({a: 3, b: 2, y: 2014, n: 2}),
          r4 = t.newRow({a: 4, b: 2, y: 2014, n: 3}),
          r5 = t.newRow({a: 5, b: 2, y: 2014, n: 3}),
          r6 = t.newRow({a: 6, b: 2, y: 2014, n: 4}),
          r7 = t.newRow({a: 2, b: 2, y: 2015, n: 1}),
          r8 = t.newRow({a: 3, b: 2, y: 2015, n: 2}),
          r9 = t.newRow({a: 4, b: 2, y: 2015, n: 3}),
          f5 = auto2.getSelector({a: 13, b: 20, y: 2014, n: 1});
      expect(t.select(f5)).toEqual([r1, r2, r3, r4, r5, r6, r7, r8, r9]);
    });

    it('should use mask when given', function () {
      const r1 = t.newRow({a: 1, b: 2, y: 2014, n: 1}),
          r2 = t.newRow({a: 2, b: 2, y: 2014, n: 1}),
          r3 = t.newRow({a: 3, b: 2, y: 2014, n: 2}),
          r4 = t.newRow({a: 4, b: 2, y: 2014, n: 3}),
          r5 = t.newRow({a: 5, b: 2, y: 2014, n: 3}),
          r6 = t.newRow({a: 6, b: 2, y: 2014, n: 4}),
          r7 = t.newRow({a: 2, b: 2, y: 2015, n: 1}),
          r8 = t.newRow({a: 3, b: 2, y: 2015, n: 2}),
          r9 = t.newRow({a: 4, b: 2, y: 2015, n: 3}),
          f6 = auto3.getSelector({a: 13, b: 20, y: 2014, n: 257}),
          f7 = auto3.getSelector({a: 13, b: 20, y: 2270, n: 1}),
          f8 = auto3.getSelector({a: 13, b: 20, y: 2014, n: 17}),
          f9 = auto3.getSelector({a: 13, b: 20, y: 2015 + 0xFFF00, n: 1 + 0xFFF0});
      expect(t.select(f6)).toEqual([r1, r2]);
      expect(t.select(f7)).toEqual([r1, r2]);
      expect(t.select(f8)).toEqual([r1, r2]);
      expect(t.select(f9)).toEqual([r7]);
    });

  });

  describe('avoidCollisions', function(){
    beforeEach(function () {
      const tableA = ds.newTable('a'),
          tableB = ds.newTable('b'),
          tableC = ds.newTable('c'),
          tableD = ds.newTable('d');
      tableA.key('idA');
      tableB.key('idA', 'idB');
      tableC.key('idA', 'idB', 'idC');
      tableD.key('idD');
      tableA.defaults({g0: 0, g1: 1, g2: 2});
      tableA.autoIncrement('idA', {});
      tableB.autoIncrement('idB', {selector: ['idA'], idLen: 5});
      tableC.autoIncrement('idC', {selector: ['idA', 'idB']});
      ds.newRelation('ab', 'a', 'idA', 'b', 'idA');
      ds.newRelation('bc', 'b', 'idA,idB', 'c', 'idA,idB');
    });



    it('should avoid collision - simple case', function(){
      const rA = ds.tables.a.newRow();  //idA = 1
      const rA2 = ds.tables.a.newRow();  //idA = 2
      const rA3 = ds.tables.a.newRow();  //idA = 3

      const rB = ds.tables.b.newRow(); //idA undefined idB 00001
      const rB2 = ds.tables.b.newRow({}, rA);//idA 1  idB 00001
      const rB3 = ds.tables.b.newRow({}, rA);//idA 1  idB 00002
      const rB4 = ds.tables.b.newRow({}, rA);//idA 1  idB 00003
      const rC1 = ds.tables.c.newRow({}, rB4);//idA 1 idB 00003 idC 1
      const rC2 = ds.tables.c.newRow({}, rB4);//idA 1 idB 00003 idC 2
      const rC3 = ds.tables.c.newRow({}, rB3);//idA 1 idB 00002 idC 1

      expect(rA2.idA).toBe(2);
      expect(rA3.idA).toBe(3);

      spyOn (ds.tables.a,'calcTemporaryId').and.callThrough();
      ds.tables.a.avoidCollisions(rA,'idA',2);
      expect(ds.tables.a.calcTemporaryId).toHaveBeenCalledWith(rA2,'idA');
      expect(ds.tables.a.calcTemporaryId.calls.count()).toBe(1);
      expect(rA.idA).toBe(1);
      expect(rA2.idA).toBe(4);

      ds.tables.a.avoidCollisions(rA, 'idA', 3);
      expect(ds.tables.a.calcTemporaryId.calls.argsFor(1)).toEqual([rA3, 'idA']);
      expect(ds.tables.a.calcTemporaryId.calls.count()).toBe(2);
      expect(rA.idA).toBe(1);
      expect(rA3.idA).toBe(5);

      ds.tables.a.avoidCollisions(rA3, 'idA', 1);
      expect(rA.idA).toBe(6);
      expect(rB2.idA).toBe(6);
      expect(rB3.idA).toBe(6);
      expect(rB4.idA).toBe(6);
      expect(rC2.idA).toBe(6);
      expect(rC3.idA).toBe(6);

      ds.tables.b.avoidCollisions(rB3,'idB','00003');
      expect(rB4.idB).toBe('00004');
      expect(rC1.idB).toBe('00004');
      expect(rC2.idB).toBe('00004');
      expect(rC3.idB).toBe('00004');


      ds.tables.b.avoidCollisions(rB2,'idA',1);



    });

    it('should avoid collision on complex case (prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['idE'], 'e', 'parIdE');
      tableE.key('idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6});
      const rE1 = tableE.newRow({});       //idE 14000001
      const rE2 = tableE.newRow({}, rE1);  //idE 1400000114000001 parIdE 14000001
      const rE3 = tableE.newRow({}, rE1);  //idE 1400000114000002 parIdE 14000001
      const rE4 = tableE.newRow({}, rE1);  //idE 1400000114000003 parIdE 14000001
      const rE5 = tableE.newRow({}, rE2);  //idE 140000011400000114000001  parIdE 1400000114000001
      const rE6 = tableE.newRow({}, rE2);  //idE 140000011400000114000002  parIdE 1400000114000001
      const rE1Bis = tableE.newRow({});       //idE 14000002

      tableE.avoidCollisions(rE1Bis,'idE','14000001');
      expect(rE2.idE).toBe('1400000314000001');
      expect(rE2.idE).toBe('1400000314000001');
      expect(rE3.idE).toBe('1400000314000002');
      expect(rE4.idE).toBe('1400000314000003');
      expect(rE5.idE).toBe('140000031400000114000001');
      expect(rE6.idE).toBe('140000031400000114000002');

    });


    it('should avoid collisions on more complex case (selectors, prefix field, middle field)', function () {
      const tableE = ds.newTable('e');
      ds.newRelation('e-e', 'e', ['ayear', 'idE'], 'e', ['ayear', 'parIdE']);
      tableE.key('ayear', 'idE');
      tableE.autoIncrement('idE', {middleConst: '14', prefixField: 'parIdE', idLen: 6, selector: ['ayear']});
      tableE.defaults({ayear: 2014});
      const rE1 = tableE.newRow({});                         //ayear 2014 idE 14000001
      const rE1bis = tableE.newRow({ayear: 2015});           //ayear 2015 idE 14000001

      const rE2 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000001  parIdE  14000001
      const rE2bis = tableE.newRow({ayear: 2015}, rE1bis);   //ayear 2015 idE 1400000114000001  parIdE  14000001
      const rE2ter = tableE.newRow({ayear: 2014}, rE1bis);   //ayear 2015 idE 1400000114000002  parIdE  14000001
      const rE2quater = tableE.newRow({ayear: 2014}, rE1bis);//ayear 2015 idE 1400000114000003  parIdE  14000001
      const rE3 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000002  parIdE  14000001
      const rE4 = tableE.newRow({}, rE1);                    //ayear 2014 idE 1400000114000003  parIdE  14000001
      const rE5 = tableE.newRow({}, rE2);     //ayear 2014 idE 140000011400000114000001  parIdE  1400000114000001
      const rE6 = tableE.newRow({}, rE2);     //ayear 2014 idE 140000011400000114000002  parIdE  1400000114000001

      expect(rE2ter.idE).toBe('1400000114000002');
      expect(rE2quater.idE).toBe('1400000114000003');
      expect(rE3.idE).toBe('1400000114000002');
      expect(rE4.idE).toBe('1400000114000003');
      expect(rE5.idE).toBe('140000011400000114000001');
      expect(rE6.idE).toBe('140000011400000114000002');

      tableE.avoidCollisions(rE1,'ayear',2015); //should change idE and leave ayear unchanged
      expect(rE1.ayear).toBe(2014);
      expect(rE1.idE).toBe('14000001');
      expect(rE1bis.ayear).toBe(2015);
      expect(rE1bis.idE).toBe('14000002');
      expect(rE2bis.idE).toBe('1400000214000001');
      expect(rE2ter.idE).toBe('1400000214000002');
      expect(rE2quater.idE).toBe('1400000214000003');
      expect(rE3.idE).toBe('1400000114000002');  //unchanged cause 2014
      expect(rE4.idE).toBe('1400000114000003');  //unchanged cause 2014
      expect(rE5.idE).toBe('140000011400000114000001'); //unchanged cause 2014
      expect(rE6.idE).toBe('140000011400000114000002'); //unchanged cause 2014

    });
  });

  describe('serialize',function(){
    it('should be a function', function () {
      const t = ds.newTable('a');
      expect(t.serialize).toEqual(jasmine.any(Function));
    });

    it('should preserve row number', function(){
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3});
      expect(t.serialize().rows.length).toBe(3);
    });
  });

  describe('deSerialize', function () {
    it('should be a function', function () {
      const t = ds.newTable('a');
      expect(t.deSerialize).toEqual(jasmine.any(Function));
    });

    it('should preserve row number', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a'), sData = JSON.parse(JSON.stringify(t.serialize()));

      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows.length).toBe(3);
    });

    it('should preserve state and value for added rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a'),
          sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.added);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.added);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.added);
      expect(t2.rows[0].a).toBe(1);
      expect(t2.rows[1].a).toBe(2);
      expect(t2.rows[2].a).toBe(3);
    });

    it('should preserve state and value for unchanged rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a');
      let sData;
      t.acceptChanges();
      sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.unchanged);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.unchanged);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.unchanged);
      expect(t2.rows[0].a).toBe(1);
      expect(t2.rows[1].a).toBe(2);
      expect(t2.rows[2].a).toBe(3);
    });

    it('should preserve state and value for deleted rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a');
      let sData;
      t.acceptChanges();
      r1.getRow().del();
      r2.getRow().del();
      r3.getRow().del();
      sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.deleted);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.deleted);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.deleted);
      expect(t2.rows[0].a).toBe(1);
      expect(t2.rows[1].a).toBe(2);
      expect(t2.rows[2].a).toBe(3);
    });

    it('should preserve state and value for modified rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a');
      let sData;
      t.acceptChanges();
      r1.a=4;
      r2.a=5;
      r3.a=6;
      sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[0].a).toBe(4);
      expect(t2.rows[1].a).toBe(5);
      expect(t2.rows[2].a).toBe(6);
      expect(t2.rows[0].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(1);
      expect(t2.rows[1].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(2);
      expect(t2.rows[2].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(3);
    });

    it('should preserve field addition for modified rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1}),
          r2 = t.newRow({a: 2}),
          r3 = t.newRow({a: 3}),
          t2 = ds2.newTable('a');
      let sData;
      t.acceptChanges();
      r1.a = 4;
      r2.b = 5;
      r3.c = 6;
      sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[0].a).toBe(4);
      expect(t2.rows[1].b).toBe(5);
      expect(t2.rows[2].c).toBe(6);
      expect(t2.rows[0].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(1);
      expect(t2.rows[1].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(2);
      expect(t2.rows[2].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(3);
      expect(t2.rows[0].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[1].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[2].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[0].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[1].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[2].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
    });

    it('should preserve field deletion for modified rows', function () {
      const t = ds.newTable('a'),
          r1 = t.newRow({a: 1, b: 4}),
          r2 = t.newRow({a: 2, b: 5}),
          r3 = t.newRow({a: 3, b: 6}),
          t2 = ds2.newTable('a');
      let sData;
      t.acceptChanges();
      r1.a = 4;
      r2.b = 5;
      r3.c = 6;
      delete r1.a;
      delete r2.b;
      delete r3.b;
      sData = JSON.parse(JSON.stringify(t.serialize()));
      expect(sData.rows.length).toBe(3);
      t2.deSerialize(sData);
      expect(t2.rows[0].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[1].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[2].getRow().state).toBe(dsSpace.dataRowState.modified);
      expect(t2.rows[0].a).toBeUndefined();
      expect(t2.rows[0].b).toBe(4);
      expect(t2.rows[0].a).toBeUndefined();
      expect(t2.rows[1].a).toBe(2);
      expect(t2.rows[1].b).toBeUndefined();
      expect(t2.rows[2].a).toBe(3);
      expect(t2.rows[2].b).toBeUndefined();
      expect(t2.rows[2].c).toBe(6);
      expect(t2.rows[0].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(1);
      expect(t2.rows[1].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(2);
      expect(t2.rows[2].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(3);
      expect(t2.rows[0].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBe(4);
      expect(t2.rows[1].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBe(5);
      expect(t2.rows[2].getRow().getValue('b', dsSpace.dataRowVersion.original)).toBe(6);
      expect(t2.rows[0].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[1].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
      expect(t2.rows[2].getRow().getValue('c', dsSpace.dataRowVersion.original)).toBeUndefined();
    });


  });
});
//TODO: test  avoidCollisions,

