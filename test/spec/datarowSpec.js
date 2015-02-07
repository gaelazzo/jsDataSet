/*global ObjectObserver */
'use strict';
/*globals beforeEach,jsDataSet, afterEach,describe,jasmine,it,expect,inject */
var  dsNameSpace = jsDataSet,
    DataRow = dsNameSpace.DataRow,
    $rowState = dsNameSpace.dataRowState,
    $q = dsNameSpace.dataQuery;


describe('DataRow module test', function () {
  var ds;


  beforeEach(function () {
    ds = new dsNameSpace.DataSet('temp');
  });

  afterEach(function () {
    ds = null;
  });

  it('Prerequisite: ObjectObserver should be defined', function () {
    expect(ObjectObserver).toBeDefined();
  });

  describe('DataRow functions', function () {
    var t, o, o2, o3, o4, p, p2, p3, p4;


    beforeEach(function () {
      t = ds.newTable('tt');
      o = {a: 1, b: 2, c: 'a'};
      o2 = {a: 1, b: 2, c: 'a'};
      o3 = {a: 2, b: 3, c: 'b'};
      o4 = {a: 3, b: 4, c: 'c'};
      p = t.load(o);
      p2 = t.load(o2);
      p3 = t.load(o3);
      p4 = t.load(o4);

    });
    afterEach(function () {
      o = o2 = o3 = o4 = null;
      p = p2 = p3 = p4 = null;
    });

    it('new DataRow should return an object', function () {
      var p = new DataRow({a: 1});
      expect(p).toEqual(jasmine.any(Object));
    });

    it('new DataRow should return a DataRow', function () {
      var p = new DataRow({a: 1});
      expect(p).toEqual(jasmine.any(DataRow));
    });


    it('new DataRow called with a DataRow object should throw exception', function () {
      var p = new DataRow({a: 1}),
        createDr = function () {
          var q = new DataRow(p);
          q.b  = 1;
        };
      expect(createDr).toThrow();
    });

    it('new DataRow called with an  object already linked to a DataRow should throw exception', function () {
      var a = {Q: 1},
        q = new DataRow(a),
        createDr = function () {
          var q2 = new DataRow(a);
          q2.b = 1;
        };
      q.b = 1;
      expect(createDr).toThrow();
    });

    it(' DataRow called with an  object already linked to a DataRow should return the linked DataRow',
      function () {
        var call = DataRow,
          a = {Q: 1},
          p = new DataRow(a),
          q = call(a);
        expect(p).toBe(q);
      });


    it('Initial value should be the same', function () {
      expect(o.a).toEqual(1);
    });

    it('Value should be changeable', function () {
      o.a = 2;
      expect(o.a).toEqual(2);
    });

    it('Initial rowstate is unchanged', function () {
      expect(o.getRow().state).toBe($rowState.unchanged);
    });

    it('Changes does modify rowstate to modified', function () {
      o.a = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      o.getRow().acceptChanges();
      expect(o.getRow().state).toBe($rowState.unchanged);
      o.a = 3;
      expect(o.getRow().state).toBe($rowState.modified);
    });

    it('Reverting changes restores rowstate to unchanged', function () {
      o.a = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      o.a = 1;
      expect(o.getRow().state).toBe($rowState.unchanged);
    });



    it('Deletes does modify rowstate to deleted', function () {

      o.getRow().del();
      expect(o.getRow().state).toBe($rowState.deleted);
    });


    it('acceptChanges should not modify current value', function () {
      o.a = 2;
      o2.a = 3;
      o.getRow().acceptChanges();
      o2.getRow().acceptChanges();
      expect(o.a).toBe(2);
    });

    it('DataRow.rejectChanges should revert modifications', function () {
      var oldA = o.a,
        oldC = o.c;
      o.a = 2;
      o.a = 1;
      o.c = 'q';
      o.a = 3;
      o.getRow().rejectChanges();
      expect(o.a).toBe(oldA);
      expect(o.c).toBe(oldC);
    });

    it('dataRow.rejectChanges should revert field additions', function () {
      expect(o.d).toBeUndefined();
      o.d = 2;
      expect(o.d).toBeDefined();
      o.getRow().rejectChanges();
      expect(o.d).toBeUndefined();
    });


    it('dataRow.rejectChanges should revert field deletions', function () {
      o.a = 2;
      o.getRow().acceptChanges();
      delete o.a;
      expect(o.a).toBeUndefined();
      o.getRow().rejectChanges();
      expect(o.a).toBeDefined();
    });

    it('adding and deleting fields results in unchanged datarowversion', function () {
      expect(o.d).toBeUndefined();
      o.d = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      o.d = 3;
      expect(o.getRow().state).toBe($rowState.modified);
      delete o.d;
      expect(o.d).toBeUndefined();
      expect(o.getRow().state).toBe($rowState.unchanged);

    });

    it('adding and deleting fields results in unchanged datarowversion', function () {
      expect(o.d).toBeUndefined();
      o.d = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      delete o.d;
      expect(o.d).toBeUndefined();
      expect(o.getRow().state).toBe($rowState.unchanged);

    });

    it('deleting and adding fields results in unchanged datarowversion', function () {
      expect(o.qq2).toBeUndefined();
      o.qq2 = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      o.getRow().acceptChanges();
      expect(o.getRow().state).toBe($rowState.unchanged);
      delete o.qq2;
      expect(o.qq2).toBeUndefined();
      expect(o.getRow().state).toBe($rowState.modified);
      o.qq2 = 2;
      expect(o.getRow().state).toBe($rowState.unchanged);

    });

    it('deleting and adding fields results in unchanged datarowversion', function () {
      expect(o.qq2).toBeUndefined();
      o.qq2 = 2;
      expect(o.getRow().state).toBe($rowState.modified);
      o.getRow().acceptChanges();
      expect(o.getRow().state).toBe($rowState.unchanged);
      delete o.qq2;
      expect(o.qq2).toBeUndefined();
      expect(o.getRow().state).toBe($rowState.modified);
      o.qq2 = 3;
      expect(o.getRow().state).toBe($rowState.modified);
      o.qq2 = 2;
      expect(o.getRow().state).toBe($rowState.unchanged);

    });
  });

  //TODO: check getAllChildRows,getAllParentRows,getParentsInTable,getChildsInTable,
  //TODO: check getParentRows,getChildRows

});