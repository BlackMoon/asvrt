Ext.define('QB.model.Ufunc', {
    extend: 'Ext.data.Model',
    fields: [ 'name', 'fnid', 'args', 'body', { name: 'out', type: 'int' }, { name: 'outaggr', type: 'int' }, 'alias',
        { name: 'filter', type: 'int' }, { name: 'filteraggr', type: 'int' }, 'oper', 'def', 'uor', { name: 'ord', type: 'int' }, { name: 'ordaggr', type: 'int' }, 'dir' ]
});