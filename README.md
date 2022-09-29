#DataSet
.Net DataSet made available for javaScript (and much more)

# Summary
A **DataSet** is a collection of DataTables and relations between tables (DataRelation).

DataSet's methods are:

## DataSet

- **rejectChanges()**: calls rejectChanges() to every DataTable in the DataSet, so the DataSet returns to the last state
  it had when acceptChanges was called last time.
- **acceptChanges**(): calls acceptChanges to every DataTable in the DataSet, so the changes are made permanent and the state of
  the table becomes DataRowState.unchanged
- **hasChanges**(): returns true if any table has any rows not in the unchanged state
- **newTable**({string}tableName) creates a new DataTable and adds it to the DataSet. Returns the created DataTable
- **addTable**({DataTable}t ) adds a table to the DataSet
- **newRelation**() creates a new DataRelation in the DataSet (see details in the jsDoc)
- **getParentChildRelation(parentName, childName)** returns the relations where parentName is the parent table and childName is the child.
- **clone()**  Clones a DataSet replicating its structure but without copying any ObjectRow
- **copy()**  Creates a copy of a DataSet including its structure and rows. Every rows will preserve its state
- **cascadeDelete(row)** Deletes a row with all subentity children. Children that are not subentity are unlinked.
- **serialize(serializeStructure)**:  Creates a serializable version of this DataSet (json convertable)
- **deserialize(d,serializeStructure)**:  Restores data from an object obtained with serialize()
- **mergeAsPut(d)**: merge changes from t. Not existing rows are merged as "added", while conflicting rows are updated.
- **mergeAsPost(d)**: merge every row from t 'as is' to this, in the state of ADDED
- **mergeAsPatch(d)**: updates rows of this DataSet making them equals to those contained in d. Only those common rows
  are affected.
- **merge(d)**: merge all row from d in the exact state as they are in t
- **importData(d)**: gets all current data from d, in the state of unchanged



## DataRelation
A **DataRelation** is an object that allow to navigate from a row in a table to other rows in same table or other tables
matching the value of parent fields in the parent table with child fields in the child table.

## DataTable
A **DataTable** is a set of DataRow, and can (and usually should) have a primary key. Special functions are available in order to manage autoincrement columns,
default values to give when a new row is created.

Some methods of DataTable are:

- **newRow(o, parentRow)**: adds a new DataRow to the table, whose value are in o and with a specified parentRow (
  if provided). o is a plain object. Defaults are applied before creating the new object, and temporary values are
  calculated after the row is created.
- **add(o)**  adds an object to the table setting the datarow in the state of "added", exactly as it is.
- **acceptChanges**(): calls acceptChanges to every row of the table, so the changes are made permanent and the state of
  the table becomes DataRowState.unchanged
- **rejectChanges**(): calls rejectChanges to every row of the table, so the changes are reverted and the state of
  the table becomes DataRowState.unchanged
- **hasChanges**(): returns true if any rows in the table is not in the unchanged state
- **select**({sqlFun}filter) searchs rows in the table that satisfy a condition. Deleted rows are skipped.
- **selectAll**({sqlFun}filter) searchs rows in the table that satisfy a condition. Deleted rows are included.
- **key**() gets/sets primary key of the table
- **clear**() removes completely all rows from the table, that becomes unchanged
- **detach**(obj) removes a row from the table
- **add**(obj) adds an object to the table and set the state of the row as DataRowState.added
- **load**(obj) loads an object in the table and set the state of the row as DataRowState.unchanged
- **getChanges**(): returns all modified/deleted/added objects in the table
- **getSortedRows(sortOrder)**: returns a sorted array of rows, does not change the DataTable
- **autoIncrement(fieldName, autoIncrementInfo)** get/set autoincrement properties of columns
- **serialize(serializeStructure)**:  Creates a serializable version of this DataTable (json convertable)
- **deserialize(d,serializeStructure)**:  Restores data from an object obtained with serialize()
- **parentRelations()**: Get all relation where THIS table is the child and another table is the parent
- **childRelations()**: Get all relation where THIS table is the parent and another table is the child
- **mergeArray(arr, overwrite)**: adds an array of objects to the table, as unchanged. Existence is verified.
  If overwrite is true, existing rows are made equals to those in the array, otherwise array's conflicting rows are ignored.
- **mergeAsPut(t)**: merge changes from t. Not existing rows are merged as "added", while conflicting rows are updated.
- **mergeAsPost(t)**: merge every row from t 'as is' to this, in the state of ADDED
- **mergeAsPatch(t)**: updates rows of this table making them equals to those contained in t.rows. Only those common rows
  are affected.
- **merge(t)**: merge all row from t in the exact state as they are in t



* If a row is not present, it is added. If it is present, it is updated.
* It is assumed that "this" dataTable is initially unchanged
*

## ObjectRow
A **ObjectRow** is a plain object attached to a pseudo-ghost-class that observes it, that is, the DataRow.
So given a plain object o, calling r = new DataRow(o) creates a DataRow object. Anyway, often it is not necessary
to invoke this constructor.

When we execute r = new DataRow(o), o becomes an "objectRow", which is linked to the created DataRow. Invoking o.getRow()
we obtain the linked DataRow.

The original object o can be modified at pleasure

## DataRow

The DataRow object has many useful functions that operates on the linked ObjectRow

- **del**()  to mark the row "deleted"
- **detach** ()  to discard the row losing all changes
- **rejectChanges**() to revert any changes made to the object since the last acceptChanges() call. A deleted row
  becomes again unchanged, and so any modified row. A new row (state=added) returns detached.
- **acceptChanges**() makes changes to the row permanent and the state of the row becomes unchanged. If the state of  
  the row was "deleted", it becomes "detached" and the row is removed from the table.
- **getValue(field,version) gets the value of a field, where version can be DataRowVersion.original
  or DataRowVersion.current. If the row is in the modified state, it's possible to get original values with this method
- **originalRow()** returns a copy of the original values of the row, that can be different from the current values.
  Returns undefined if the RowState is DataRowState.added
- **makeSameAs(r)** Make this row identical to another row (both in state, original and current value)
- **patchTo(o)** changes linked row to make its current values equal to an object. Deleted rows becomes modified.
- **makeEqualTo(o)** changes linked row to make its current values equal to an object. Deleted rows becomes modified.
  Compared to patchTo, this also removes values that are not present in o
- **getAllParentRows()** gets all parent rows of this row in any table
- **getAllChildRows()**  gets all children rows of this row in any table
- **getParentsInTable(tableName)** get children rows in a specified table
- **getChildInTable(tableName)**  get parent rows in a specified table
- **getParentRows**(relName), **getParentsInTable**(parentTableName), **getChildsInTable**(childTableName),
- **getChildRows**(relName)  are useful to navigate from a row to others related in the same DataSet.
- **keySample()**  Get an object with all key fields of this row


A DataRow has a **status** whose value can be one of DataRowState.**added**, DataRowState.**unchanged**, DataRowState.**modified**,
DataRowState.**deleted**, DataRowState.**detached**.

It is possible to access old/new values of a DataRow when it has been modified, with the function **getValue**(fieldName, dataRowVersion)
where dataRowVersion can be DataRowVersion.original, or the default DataRowVersion.current.

If DataRowVersion.original is specified, it returns the original value of the field if it has been modified after the last
acceptChanges or RejectChanges.

It's also possible to accept/reject changes on the entire DataTable or DataSet all at once, merging changes of a DataSet into another one
(see **importData**, **mergeAsPatch** , **mergeAsPost**, **mergeAsPut**).

A DataSet can also be serialized/deserialized into a plain object
(that includes also all original/modified values of all rows).  The serialized version can optionally contain also the structure of
the DataSet (key, relations, defaults, orderings, autoincrement columns and so on).

It's also possible to delete a row with all its children (with cascading effect) from a DataSet, with the function **cascadeDelete**(row).


## objectRow and Proxy
Object stored in a DataTable are "objectRow", that is, an object enveloped in a proxy, which keeps track of all
modification made, in order to be able to retrieve both current values and original values.

An objectRow is obtained by a plain object with the constructor of the class DataRow.
The DataRow adds a function getRow() to the plain object, which returns the linked DataRow itself.

So if we have a DataRow DR, DR.current is a proxy that envelopes the object o it is linked to,
while o.getRow() returns DR.


A full list of available function is available in the auto-generated yui doc.

Full details are available [here](docs/module-DataSet.html)

Let's see some DataSet examples:

    const dsSpace = require('../../client/components/metadata/DataSet'); 
    const q = require('../../client/components/metadata/jsDataQuery');
    let ds = new dsSpace.DataSet('temp');  
    t = ds.newTable('tab');
    const o1 = {a: 1, b: 2};
    t.add(o1); 
    expect(o1.getRow().state).toBe(dsSpace.dataRowState.added);

when a plain object is added to a DataTable it is enriched with  a DataRow object and a method getRow() that returns it.

It is possible to operate with the original objects and the state of the linked DataRow will stay automatically in sync.

Extensive unit test are available [here](test/client/DataSetSpec.js)

Example of rejectChanges:

    t = ds.newTable('tt'); 
    p = t.load({a: 1, b: 2, c: 'a'});  //load o in the table in the state of unchanged, p is the DataRow
    o = p.current; //o is the current value of the Row
    o.a = 2
    expect(o.a).toBe(2);
    expect(o.getRow().originalRow().a).toBe(1); //original value of the field is 1
    o.getRow().rejectChanges(); // also o.$rejectChanges;
    expect(o.a).toBe(1);

Select:

    expect(t.select(q.eq('a', 1)).length).toBe(1);  //select selects a set of rows given a filter






![](https://travis-ci.org/gaelazzo/jsDataSet.svg?branch=master)

