/*global ObjectObserver */
'use strict';
/*globals beforeEach,DataSet, afterEach,describe,jasmine,it,expect,inject,getRow */


describe('DataRow module test', function () {
    var  dsNameSpace = jsDataSet,
        DataRow = dsNameSpace.DataRow,
        $rowState = dsNameSpace.dataRowState,
        ds;



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
            o = {a: 1, b: 2, c: 'a'};           //o,o2,o3,o4 are plain object  (objectRow)
            o2 = {a: 1, b: 2, c: 'a'};
            o3 = {a: 2, b: 3, c: 'b'};
            o4 = {a: 3, b: 4, c: 'c'};
            p = t.load(o);                  //p,p2,p3,p4 are linked DataRow
            p2 = t.load(o2);
            p3 = t.load(o3);
            p4 = t.load(o4);
            o= p.current;
            o2= p2.current;
            o3= p3.current;
            o4= p4.current;


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

        it('new DataRow called with an  object already linked to a DataRow should not throw exception', function () {
            var a = {Q: 1},
                q = new DataRow(a),
                createDr = function () {
                    var q2 = new DataRow(a);
                    q2.b = 1;
                };
            q.b = 1;
            expect(createDr).not.toThrow();
        });
        it('new DataRow called with an  object already linked to a DataRow should create an independent DataRow', function () {
            var a = {Q: 1},
                q = new DataRow(a),
                createDr = function () {
                    var q2 = new DataRow(a);
                    q2.b = 1;
                };
            q.b = 1;
            q.Q = 2;
            expect(a.Q).toBe(1);
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
            expect(p.state).toBe($rowState.modified);
            p.acceptChanges();
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

    describe('DataRow relations', function () {
        var t, o, o2, o3, o4, p, p2, p3, p4,
            q, o5, o6, o7, o8, o9, p5,p6,p7,p8,p9,
            s, o10, o11, o12,o13,o14,o15, p10,p11,p12,p13,p14,p15,
            u, o16,o17,o18,o19, p16,p17,p18,p19,
            d;


        beforeEach(function () {
            d = new dsNameSpace.DataSet("dummy name");

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
            d.newRelation('r3','par2',['a'],'child1',['b']); //par2 to child1 through a->b
            d.newRelation('r5','par1',['c'],'child1',['c']); //par1 to child1 through c->c
            d.newRelation('r2','par1',['b'],'child2',['b']); //par1 to child2 through b->b
            d.newRelation('r4','par2',['b'],'child2',['a']); //par2 to child2 through b->a
            d.newRelation('r6','par2',['c'],'child2',['c']); //par2 to child2 through c->c

        });
        afterEach(function () {
            d = t = q = s = u = null;
            o = o2 = o3 = o4 = o5 = o6 = o7 = o8 = o9 = o10 = o11 = o12 = o13 = o14 = o15 = o16 = o17 = o18 =o19 = null;
            p = p2 = p3 = p4 = p5 = p6 = p7 = p8 = p9 = p10 = p11 = p12 = p13 = p14 = p15 = p16 = p17 = p18 =p19 = null;
        });

        it('getParentRows should give parent of a row through a specified relation', function(){
            expect(p10.getParentRows('r1')).toEqual([o,o2]);
            expect(p11.getParentRows('r1')).toEqual([o3]);
            expect(p12.getParentRows('r1')).toEqual([]);
            expect(p13.getParentRows('r1')).toEqual([]);
            expect(p14.getParentRows('r1')).toEqual([]);

            expect(p10.getParentRows('r3')).toEqual([]);
            expect(p11.getParentRows('r3')).toEqual([o7]);
            expect(p12.getParentRows('r3')).toEqual([]);
            expect(p13.getParentRows('r3')).toEqual([]);
            expect(p14.getParentRows('r3')).toEqual([o8,o9]);

            expect(p10.getParentRows('r5')).toEqual([o3]);
            expect(p11.getParentRows('r5')).toEqual([o]);
            expect(p12.getParentRows('r5')).toEqual([]);
            expect(p13.getParentRows('r5')).toEqual([]);
            expect(p14.getParentRows('r5')).toEqual([]);



        });


        it('getParentsInTable should give parent of a row in a specified table', function(){
            expect(p10.getParentsInTable('par1')).toHaveSameItems([o,o2,o3],true);
            expect(p11.getParentsInTable('par1')).toHaveSameItems([o3,o],true);
            expect(p12.getParentsInTable('par1')).toHaveSameItems([]);
            expect(p13.getParentsInTable('par1')).toHaveSameItems([]);
            expect(p14.getParentsInTable('par1')).toHaveSameItems([]);

            expect(p10.getParentsInTable('par2')).toEqual([]);
            expect(p11.getParentsInTable('par2')).toHaveSameItems([o7],true);
            expect(p12.getParentsInTable('par2')).toEqual([]);
            expect(p13.getParentsInTable('par2')).toEqual([]);
            expect(p14.getParentsInTable('par2')).toHaveSameItems([o8,o9],true);
        });

        it('getAllParentRows should give all parent of a row', function(){
            expect(p10.getAllParentRows()).toHaveSameItems([o,o2,o3],true);
            expect(p11.getAllParentRows()).toHaveSameItems([o,o3,o7],true);
            expect(p12.getAllParentRows()).toEqual([]);
            expect(p13.getAllParentRows()).toEqual([]);
            expect(p14.getAllParentRows()).toHaveSameItems([o8,o9],true);
        });



        it('getChildRows should give childs of a row through a specified relation', function(){
            expect(p.getChildRows('r1')).toEqual([o10]);
            expect(p2.getChildRows('r1')).toEqual([o10]);
            expect(p3.getChildRows('r1')).toEqual([o11]);
            expect(p4.getChildRows('r1')).toEqual([]);

            expect(p.getChildRows('r2')).toEqual([]);
            expect(p2.getChildRows('r2')).toEqual([]);
            expect(p3.getChildRows('r2')).toEqual([o15]);
            expect(p4.getChildRows('r2')).toEqual([o16]);

            expect(p.getChildRows('r3')).toEqual([]);
            expect(p2.getChildRows('r3')).toEqual([]);
            expect(p3.getChildRows('r3')).toEqual([o11]);
            expect(p4.getChildRows('r3')).toEqual([o14]);

            expect(p.getChildRows('r4')).toEqual([]);
            expect(p2.getChildRows('r4')).toEqual([]);
            expect(p3.getChildRows('r4')).toHaveSameItems([o15,o16],true);
            expect(p4.getChildRows('r4')).toEqual([o17]);


            expect(p.getChildRows('r5')).toEqual([o11]);
            expect(p2.getChildRows('r5')).toEqual([]);
            expect(p3.getChildRows('r5')).toEqual([o10]);
            expect(p4.getChildRows('r5')).toEqual([]);



            expect(p5.getChildRows('r3')).toEqual([]);
            expect(p6.getChildRows('r3')).toEqual([]);
            expect(p7.getChildRows('r3')).toEqual([o11]);
            expect(p8.getChildRows('r3')).toEqual([o14]);
            expect(p9.getChildRows('r3')).toEqual([o14]);

            expect(p5.getChildRows('r4')).toEqual([]);
            expect(p6.getChildRows('r4')).toEqual([]);
            expect(p7.getChildRows('r4')).toEqual([]);
            expect(p8.getChildRows('r4')).toEqual([o17]);
            expect(p9.getChildRows('r4')).toEqual([o17]);

            expect(p5.getChildRows('r6')).toEqual([]);
            expect(p6.getChildRows('r6')).toEqual([]);
            expect(p7.getChildRows('r6')).toEqual([]);
            expect(p8.getChildRows('r6')).toEqual([o18]);
            expect(p9.getChildRows('r6')).toEqual([]);


        });

        it('getAllChildRows should give all childs of a row in all tables', function() {
            expect(p.getAllChildRows()).toHaveSameItems([o10,o11],true);
            expect(p2.getAllChildRows()).toEqual([o10]);
            expect(p3.getAllChildRows()).toHaveSameItems([o10,o11,o15],true);
            expect(p4.getAllChildRows()).toEqual([o16]);
        });


        it('getChildRows should give childs of a row in a specified table', function(){
            expect(p.getChildInTable('child1')).toHaveSameItems([o10,o11],true);
            expect(p2.getChildInTable('child1')).toEqual([o10]);
            expect(p3.getChildInTable('child1')).toHaveSameItems([o10,o11],true);
            expect(p4.getChildInTable('child1')).toEqual([]);

            expect(p.getChildInTable('child2')).toEqual([]);
            expect(p2.getChildInTable('child2')).toEqual([]);
            expect(p3.getChildInTable('child2')).toEqual([o15]);
            expect(p4.getChildInTable('child2')).toEqual([o16]);


        });
    });



});