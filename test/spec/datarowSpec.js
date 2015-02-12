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
                    q.b = 1;
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

    describe('DataRow functions', function () {
        var t, o, o2, o3, o4, p, p2, p3, p4,
            q, o5, o6, o7, o8, o9, p5,p6,p7,p8,p9,
            s, o10, o11, o12,o13,o14,o15, p10,p11,p12,p13,p14,p15,
            u, o16,o17,o18,o19,o20, p16,p17,p18,p19,p20,
            d;


        beforeEach(function () {
            d = new jsDataSet.DataSet("dummy name");

            t = d.newTable('par1');
            o = {a: 1, b: 2, c: 'a'};
            o2 = {a: 1, b: 2, c: 'b'};
            o3 = {a: 2, b: 3, c: '1a'};
            o4 = {a: 3, b: 4, c: 'c'};
            p = t.load(o);p2 = t.load(o2);p3 = t.load(o3);p4 = t.load(o4);

            q = d.newTable('par2');
            o5 = {a: 11, b: 2, c: 'a'};
            o6 = {a: 1, b: 12, c: 'aa'};
            o7 = {a: 2, b: 13, c: 'b2'};
            o8 = {a: 3, b: 4, c: 'c1'};
            o9 = {a: 3, b: 4, c: 'c11'};
            p5 = q.load(o5);p6 = q.load(o6);p7 = q.load(o7);p8 = q.load(o8);p9 = q.load(o9);

            s = d.newTable('child1');
            o10 = {a: 1, b: 12, c: '1a'};
            o11 = {a: 2, b: 2, c: 'a'};
            o12 = {a: 23, b: 4, c: 'b2'};
            o13 = {a: 4, b: 8, c: 'c1'};
            o14 = {a: 7, b: 3, c: 'c12'};
            p10 = s.load(o10);p11 = s.load(o11);p12 = s.load(o12);p13 = s.load(o13);p14= s.load(o14);

            u = d.newTable('child2');
            o15 = {a: 3, b: 3, c: '1a'};
            o16 = {a: 3, b: 4, c: '2a'};
            o17 = {a: 4, b: 5, c: 'b'};
            o18 = {a: 5, b: 6, c: 'c1'};
            o19 = {a: 6, b: 7, c: 'c'};
            p15 = u.load(o15);p16 = u.load(o16);p17 = u.load(o17);p18 = u.load(o18);p19= u.load(o19);


            d.newRelation('r1','par1',['a'],'child1',['a']); //par1 to child1 through a->a
            d.newRelation('r2','par1',['b'],'child2',['b']); //par1 to child2 through b->b
            d.newRelation('r3','par2',['a'],'child1',['b']); //par2 to child1 through a->b
            d.newRelation('r4','par2',['b'],'child2',['a']); //par2 to child2 through b->a
            d.newRelation('r5','par1',['c'],'child1',['c']); //par1 to child1 through c->c
            d.newRelation('r6','par2',['c'],'child2',['c']); //par2 to child2 through c->c

        });
        afterEach(function () {
            d = t = q = s = u = null;
            o = o2 = o3 = o4 = o5 = o6 = o7 = o8 = o9 = o10 = o11 = o12 = o13 = o14 = o15 = o16 = o17 = o18 =o19 = null;
            p = p2 = p3 = p4 = p5 = p6 = p7 = p8 = p9 = p10 = p11 = p12 = p13 = p14 = p15 = p16 = p17 = p18 =p19 = null;
        });

        it('getParentRows should give parent of a row through a specified relation', function(){
            expect(p10.getParentRows('r1')).toEqual([o,o2]);
        });
        it('getParentRows should give parent of a row through a specified relation', function(){
            expect(p10.getParentRows('r5')).toEqual([o3]);
        });



        it('getParentsInTable should give parent of a row in a specified table', function(){
            expect(p10.getParentsInTable('par1')).toEqual([o,o2,o3]);
        });

        it('getAllParentRows should give all parent of a row', function(){
            expect(p5.getAllParentRows()).toEqual([]);
        });

    });

    //TODO: check getAllChildRows,getAllParentRows,getParentsInTable,getChildsInTable,
    //TODO: check getParentRows,getChildRows

});