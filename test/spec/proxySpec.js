/*global ObjectObserver */
///'use strict';
/*globals beforeEach,jsDataSet, afterEach,describe,jasmine,it,expect,inject,getRow */


describe('proxy object test', function () {
    it('Proxy set assigns values', function(){
        var x = {a:1};
        const p  = new Proxy(x,{});
        p.b=2;
        p.a=3;

        expect(p.b).toBe(2);
        expect(p.a).toBe(3);
        expect(x.a).toBe(3);
        expect(x.b).toBe(2);
    });

    it('Proxy set gets actual values', function(){
        var x = {a:1};
        const p  = new Proxy(x,{});
        x.b=2;
        x.a=3;

        expect(p.b).toBe(2);
        expect(p.a).toBe(3);

    });

    it('Proxy set of new fields invokes define property', function(){
        var x = {a:1};
        var  invokedWith;
        const p  = new Proxy(x,{
            defineProperty: function(target, property, descriptor) {
                invokedWith=property;
            }
        });
        p.b=2;
        expect(invokedWith).toBe('b');

    });


    it('Proxy delete of fields invokes delete property', function(){
        var x = {a:1};
        var  invokedWith;
        const p  = new Proxy(x,{
            deleteProperty: function(target, property, descriptor) {
                invokedWith=property;
            }
        });
       delete p.a;
       expect(invokedWith).toBe('a');
    });

    it('Proxy set of fields invokes set', function(){
        var x = {a:1};
        var  invokedWithField,invokeWithOldValue;

        const p  = new Proxy(x,{
            set: function(target, property, value, receiver) {
                invokedWithField=property;
                invokeWithOldValue= target[property];
                target[target]=value;
            }
        });
        p.b=2;
        expect(invokedWithField).toBe('b');
        expect(invokeWithOldValue).toBe(undefined);
        p.a=10;
        expect(invokedWithField).toBe('a');
        expect(invokeWithOldValue).toBe(1);

    });

    it('Object set of fields does not invokes set', function(){
        var x = {a:1};
        var  invokedWithField,invokeWithOldValue;

        const p  = new Proxy(x,{
            set: function(target, property, value, receiver) {
                invokedWithField=property;
                invokeWithOldValue= target[property];
                target[target]=value;
            }
        });
        x.b=2;
        expect(invokedWithField).toBe(undefined);
        expect(invokeWithOldValue).toBe(undefined);
        x.a=3;
        expect(invokedWithField).toBe(undefined);
        expect(invokeWithOldValue).toBe(undefined);

    });

    it('Object set breaks on false', function(){
        var x = {a:1};
        var  invokedWithField,invokeWithOldValue;

        const p  = new Proxy(x,{
            set: function(target, property, value, receiver) {
                return false;
            }
        });
        p.a=2;
        expect(invokedWithField).toBe(undefined);
        expect(invokeWithOldValue).toBe(undefined);
        expect(x.a).toBe(1);

    });

});