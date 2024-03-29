/*jslint  nomen:true*/
/*jslint  nomen:true*/
/*globals _ ,  DataSet, jasmine, beforeEach, expect, module, it,  describe, spyOn, afterEach  */
//console.log('defining datasetSpec');
'use strict';

describe('System status', function () {
  const dsSpace = jsDataSet,
      $q = jsDataQuery;
  let ds;


  beforeEach(function () {
    ds = new dsSpace.DataSet('temp');
  });

  it('dsSpace should be defined', function () {
    expect(dsSpace).not.toBeNull();
  });
  it('$q should be defined', function () {
    expect($q).not.toBeNull();
  });
  it('_ should be defined', function () {
    expect(_).not.toBeNull();
  });
});


describe('DataSet',
  function () {
    const dsSpace = jsDataSet,
        $q = jsDataQuery;
    let ds;


    beforeEach(function () {
      ds = new dsSpace.DataSet('temp');
    });
    afterEach(function () {
      ds = null;
    });

    it('dsSpace should be defined', function () {
      expect(dsSpace).toBeDefined();
    });


    describe('DataSet Structure', function () {
      it('ds should be defined', function () {
        expect(ds).toBeDefined();
      });

      it('ds.tables should be defined', function () {
        expect(ds.tables).toBeDefined();
      });

      it('ds.relations  should be defined', function () {
        expect(ds.relations).toBeDefined();
      });

      it('ds should have a field name', function () {
        expect(ds.name).toBeDefined();
      });

      it('ds name should be not null', function () {
        expect(ds.name).not.toBeNull();
      });


      it('ds should have a string field name', function () {
        expect(ds.name).toEqual(jasmine.any(String));
      });

      it('dsSpace.DataRow should be a function', function () {
        expect(dsSpace.DataRow).toEqual(jasmine.any(Function));
      });

    });

    describe('DataSet Functions', function () {
      it('ds.name should be writeable', function () {
        ds.name = 'D';
        expect(ds.name).toMatch('D');
      });
      it('ds should have a clone function', function () {
        expect(ds.clone).toEqual(jasmine.any(Function));
      });

      it('ds.clone should return a DataSet', function () {
        expect(ds.clone() instanceof  dsSpace.DataSet).toBeTruthy();
      });

      it('ds.clone should create tables', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('a_b', 'a', ['x'], 'b', ['y']);
        expect(ds.clone().tables.a).toBeDefined();
        expect(ds.clone().tables.b).toBeDefined();
      });

      it('ds.clone should fill tables with DataTables', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('a_b', 'a', ['x'], 'b', ['y']);
        expect(ds.clone().tables.a.toString()).toEqual('DataTable a');
      });

      it('ds.clone should create relations', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('ab', 'a', ['x'], 'b', ['y']);
        expect(ds.clone().relations.ab).toBeDefined();
      });


      it('ds.copy should return something', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('ab', 'a', ['x'], 'b', ['y']);
        expect(ds.copy()).not.toBeNull();
      });


      it('ds.copy should return a dataset', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('ab', 'a', ['x'], 'b', ['y']);
        expect(ds.copy() instanceof  dsSpace.DataSet).toBeTruthy();
      });

      it('spyOn(ds, \'clone\') should return something ', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('ab', 'a', ['x'], 'b', ['y']);
        expect(spyOn(ds, 'clone')).toBeDefined();
      });

      it('spyOn(ds, \'clone\').and should return something ', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('a_b', 'a', ['x'], 'b', ['y']);
        expect(spyOn(ds, 'clone').and).toBeDefined();
      });


      it('ds.copy should call ds.clone', function () {
        ds.newTable('a');
        ds.newTable('b');
        ds.newRelation('a_b', 'a', ['x'], 'b', ['y']);
        spyOn(ds, 'clone').and.callThrough();
        ds.copy();
        expect(ds.clone).toHaveBeenCalled();
      });


      it('ds.copy should copy rows', function () {
        let tA = ds.newTable('a'),
            newDs,
            newTa;
        tA.add({a: 1});
        tA.add({a: 2});
        ds.newTable('b');
        ds.newRelation('a_b', 'a', ['x'], 'b', ['y']);
        newDs = ds.copy();
        newTa = newDs.tables.a;
        expect(newTa.rows.length).toEqual(2);
        expect(newTa.select($q.eq('a', 1)).length).toBe(1);
      });


    });


    describe('DataRelation functions', function () {

      it('ds.relations should exists', function () {
        expect(ds.relations).toBeDefined();
      });

      it('ds.newRelation should be a function', function () {
        expect(ds.newRelation).toEqual(jasmine.any(Function));
      });

      it('calling ds.newRelation adds a relation to ds.relations', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('ab', 'a', ['field1'], 'b', ['field2']);
        expect(ds.relations.ab).toBe(rel);
      });


        it('newRelation adds a relation to ds.relations', function () {
        ds.newTable('a');
        ds.newTable('b');
          const rel = ds.newRelation('ab', 'a', ['field1'], 'b', ['field2']);
          expect(ds.relations.ab).toBe(rel);
      });

      it('newRelation  adds a relation to ds.relations (case with comma separated field list)', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('ab', 'a', 'field1,field2', 'b', 'field3,field4');
        expect(ds.relations.ab).toBe(rel);
        expect(rel.parentCols.length).toBe(2);
        expect(rel.childCols.length).toBe(2);
      });


      it('relation.getChildsFilter should be a function', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['field1'], 'b', ['field2']);
        expect(rel.getChildFilter).toEqual(jasmine.any(Function));
      });

      it('relation.getChildsFilter should return a function', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['field1'], 'b', ['field2']),
            r = {a: 1};
        expect(rel.getChildFilter(r)).toEqual(jasmine.any(Function));
      });

      it('relation.getChildsFilter().toSql should be a function', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            r = {A0: 3, A1: null, A2: 'nino', A3: 'arance'};
        expect(rel.getChildFilter(r).toSql).toEqual(jasmine.any(Function));
      });

      it('relation.getChildsFilter() should return false on non matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 6, A1: 12, A2: 'nino', A3: 'arance'},
            rB = {B0: 6, B1: 12, B2: 'anna', B3: 'arance'};
        expect(rel.getChildFilter(rA)(rB)).toBeFalsy();
      });

      it('relation.getChildsFilter() should return true on matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 10, A1: 12, A2: 'nino', A3: 'arance'},
            rB = {B0: 10, B1: 12, B2: 'nino', B3: 'pere'};
        expect(rel.getChildFilter(rA)(rB)).toBeTruthy();
      });

      it('relation.getChildsFilter() should return false on (with null)-matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 10, A1: null, A2: 'nino', A3: 'arance'},
            rB = {B0: 10, B1: null, B2: 'nino', B3: 'pere'};
        expect(rel.getChildFilter(rA)(rB)).toBeFalsy();
      });
      it('relation.getParentsFilter() should return false on non matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 6, A1: 13, A2: 'nino', A3: 'arance'},
            rB = {B0: 6, B1: 13, B2: 'anna', B3: 'arance'};
        expect(rel.getParentsFilter(rB)(rA)).toBeFalsy();
      });

      it('relation.getParentsFilter() should return true on matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 10, A1: 13, A2: 'nino', A3: 'arance'},
            rB = {B0: 10, B1: 13, B2: 'nino', B3: 'pere'};
        expect(rel.getParentsFilter(rB)(rA)).toBeTruthy();
      });

      it('relation.getParentsFilter() should return false on (with null)-matching objects', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 10, A1: null, A2: 'nino', A3: 'arance'},
            rB = {B0: 10, B1: null, B2: 'nino', B3: 'pere'};
        expect(rel.getParentsFilter(rB)(rA)).toBeFalsy();
      });

      it('getting a relation function should call _.map', function () {
        ds.newTable('a');
        ds.newTable('b');
        spyOn(dsSpace.myLoDash, 'map').and.callThrough();
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 3, A1: null, A2: 'nino', A3: 'arance'};

        rel.getChildFilter(rA, 'qq');
        expect(dsSpace.myLoDash.map).toHaveBeenCalled();
      });

      it('getting a getChildsFilter function should call _.map with  parentCols as first argument ', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 4, A1: null, A2: 'nino', A3: 'arance'};
        spyOn(dsSpace.myLoDash, 'map').and.callThrough();
        rel.getChildFilter(rA);
        expect(dsSpace.myLoDash.map.calls.first().args[0]).toBe(rel.parentCols);
      });

      it('getting a getParentsFilter function should call _.map with  childCols as first argument ', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rB = {B0: 3, B1: null, B2: 'nino', B3: 'pere'};
        spyOn(dsSpace.myLoDash, 'map').and.callThrough();
        rel.getParentsFilter(rB);
        expect(dsSpace.myLoDash.map.calls.first().args[0]).toBe(rel.childCols);
      });


      it('calling a relation function should not call _.map', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
            rA = {A0: 8, A1: null, A2: 'nino', A3: 'arance'},
            rB = {B0: 9, B1: null, B2: 'nino', B3: 'pere'},
            f = rel.getChildFilter(rA, 'qq');
        spyOn(dsSpace.myLoDash, 'map').and.callThrough();
        f(rB);
        expect(dsSpace.myLoDash.map).not.toHaveBeenCalled();
      });


      it('dataSet.relationsByParent and should be set relationsByChild after calling newRelation', function () {
        ds.newTable('a');
        ds.newTable('b');
        const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']);
        expect(ds.relationsByParent.a).toEqual([rel]);
        expect(ds.relationsByChild.b).toEqual([rel]);
        expect(ds.relationsByParent.b).toEqual([]);
        expect(ds.relationsByChild.a).toEqual([]);
      });

        it('dataSet.relationsByParent and should be set relationsByChild after calling newRelation', function () {
            ds.newTable('a');
            ds.newTable('b');
          const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']);
          expect(ds.getParentChildRelation('b','a')).toEqual([]);
            expect(ds.getParentChildRelation('a','c')).toEqual([]);
            expect(ds.getParentChildRelation('a','b')).toEqual([rel]);
        });



        it('clone should preserve relationsByParent relationsByChild and ', function () {
        ds.newTable('a');
        ds.newTable('b');
          const rel = ds.newRelation('a_b', 'a', ['A1', 'A2'], 'b', ['B1', 'B2']),
              d2 = ds.clone();

          expect(_.map(d2.relationsByParent.a, function(r){
          return _.pick(r,['parentTable','parentCols','childTable','childCols']);
         } ))
         .toEqual([_.pick(rel, ['parentTable', 'parentCols', 'childTable', 'childCols'])]);
        expect(_.map(d2.relationsByChild.b, function (r) {
          return _.pick(r, ['parentTable', 'parentCols', 'childTable', 'childCols']);
        }))
          .toEqual([_.pick(rel, ['parentTable', 'parentCols', 'childTable', 'childCols'])]);
        expect(d2.relationsByParent.b).toEqual([]);
        expect(d2.relationsByChild.a).toEqual([]);
      });
    });

    describe('OptimisticLocking functions', function(){
      let $ol, stubEnv;
      beforeEach(function(){
        $ol = dsSpace.OptimisticLocking;
        stubEnv= {
          sys:function(field){return 'sys_'+field;},
          usr:function(field){return 'usr_'+field;},
          field: function(field){return 'field_'+field;}
        };
      });

      it('OptimisticLocking should be defined', function(){
        expect($ol).toBeDefined();
      });

      it('OptimisticLocking should be a constructor', function () {
        expect($ol).toEqual(jasmine.any(Function));
        expect($ol.prototype.constructor).toEqual($ol);
      });

      it('OptimisticLocking should return an object with a method prepareForPosting ', function () {
        const o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);
        expect(o.prepareForPosting).toEqual(jasmine.any(Function));

      });

      it('OptimisticLocking should return an object with a method getOptimisticLock ', function () {
        const o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);
        expect(o.getOptimisticLock).toEqual(jasmine.any(Function));
      });

      it('prepareForPosting should fill update fields for modified rows', function(){
        const t = ds.newTable('a'),
            r = t.newRow({a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'}),
            p = r.getRow().current,
            o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);
        t.acceptChanges();
        p.a=10;
        o.prepareForPosting(r, stubEnv);
        expect(r).toEqual({a:10,b:2,ct:'ct',cu:'cu',lt:'field_lt',lu:'field_lu'});
      });

      it('prepareForPosting should fill create fields for added rows', function () {
        const t = ds.newTable('a'),
            r = t.newRow({a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'}),
            o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);
        o.prepareForPosting(r, stubEnv);
        expect(r).toEqual({a: 1, b: 2, ct: 'field_ct', cu: 'field_cu', lt: 'field_lt', lu: 'field_lu'});
      });

      it('getOptimisticLock should return a function that matches the original row',  function(){
        const t = ds.newTable('a'),
            r = t.newRow({id: 10, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'}),
            o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);
        t.key(['id']);
        const filter = o.getOptimisticLock(r);
        expect(t.select(filter)).toEqual([r]);
        //check filter is comparing lt
        r.lt='no';
        expect(t.select(filter)).toEqual([]);
        r.lt = 'lt';

        //check filter is comparing lu
        r.lu = 'no';
        expect(t.select(filter)).toEqual([]);

        //check again filter is doing something
        r.lu = 'lu';
        expect(t.select(filter)).toEqual([r]);

        //check filter is not comparing ct, cu
        r.ct = 'no';
        r.cu = 'no';
        expect(t.select(filter)).toEqual([r]);

        //check filter is comparing key
        r.id=13;
        expect(t.select(filter)).toEqual([]);

        //again we test in the original condition
        r.id=10;
        expect(t.select(filter)).toEqual([r]);
      });

      it('getOptimisticLock should return a function that matches the original row (no primary key)', function () {
        const t = ds.newTable('a'),
            r = t.newRow({id: 10, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'}),
            o = new $ol(['lt', 'lu'], ['ct', 'cu', 'lt', 'lu']);

        //t.key(['id']); no key here

        const filter = o.getOptimisticLock(r);
        expect(t.select(filter)).toEqual([r]);
        //check filter is comparing lt
        r.lt = 'no';
        expect(t.select(filter)).toEqual([]);
        r.lt = 'lt';

        //check filter is comparing lu
        r.lu = 'no';
        expect(t.select(filter)).toEqual([]);

        //check again filter is doing something
        r.lu = 'lu';
        expect(t.select(filter)).toEqual([r]);

        //check filter IS comparing ct, cu
        r.ct = 'no';
        r.cu = 'no';
        expect(t.select(filter)).toEqual([]);

        //check filter IS comparing also b
        r.ct = 'ct';
        r.cu = 'cu';
        r.b = 3;
        expect(t.select(filter)).toEqual([]);

        r.b = 2;

        //check filter is comparing key
        r.id = 13;
        expect(t.select(filter)).toEqual([]);

        //again we test in the original condition
        r.id = 10;
        expect(t.select(filter)).toEqual([r]);
      });
    });

    describe('serialize/deserialize', function () {
      let t, t2, r, r1, r2, s, s1, s2, s3;
      beforeEach(function () {
        t = ds.newTable('a');
          r = t.newRow({id: 10, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          r1 = t.newRow({id: 11, a: 123, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          r2 = t.newRow({id: 12, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          t2 = ds.newTable('b');
          s = t2.newRow({id: 13, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          s1 = t2.newRow({id: 14, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          s2 = t2.newRow({id: 15, a: 1, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
          s3 = t2.newRow({id: 16, a: 2, b: 2, ct: 'ct', lt: 'lt', cu: 'cu', lu: 'lu'});
        s2.getRow().acceptChanges();
        s2.getRow().del();
        r1.getRow().acceptChanges();
        r1.a = 21;
      });
      it('should preserve tables', function () {
        const sData = JSON.parse(JSON.stringify(ds.serialize()));
        const ds2 = new dsSpace.DataSet('dd');
        ds2.deSerialize(sData);
        expect(_.keys(ds2.tables).length).toBe(2);
      });

      it('should preserve row count', function () {
        const sData = JSON.parse(JSON.stringify(ds.serialize()));
        const ds2 = new dsSpace.DataSet('dd');
        ds2.deSerialize(sData);
        expect(ds2.tables.a.rows.length).toBe(3);
        expect(ds2.tables.b.rows.length).toBe(4);
      });

      it('should preserve row values', function () {
        const sData = JSON.parse(JSON.stringify(ds.serialize()));
        const ds2 = new dsSpace.DataSet('dd');
        ds2.deSerialize(sData);
        expect(ds2.tables.a.rows).toEqual(ds.tables.a.rows);
        expect(ds2.tables.b.rows).toEqual(ds.tables.b.rows);
      });

      it('should preserve original values', function () {
        const sData = JSON.parse(JSON.stringify(ds.serialize()));
        const ds2 = new dsSpace.DataSet('dd');
        ds2.deSerialize(sData);
        expect(ds2.tables.a.select($q.eq('id',11))[0].getRow().getValue('a', dsSpace.dataRowVersion.original)).toBe(123);
      });

      it('should preserve current values', function () {
        const sData = JSON.parse(JSON.stringify(ds.serialize()));
        const ds2 = new dsSpace.DataSet('dd');
        ds2.deSerialize(sData);
        expect(ds2.tables.a.select($q.eq('id', 11))[0]['a']).toBe(21);
      });


    });


    describe('merge functions', function(){
      //TODO all those
    });

  });


