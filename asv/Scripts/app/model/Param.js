Ext.define('QB.model.Param', {
    extend: 'Ext.data.Model',
    fields: ['field', 'formula', 'alias', 'ax', 'schema', 'tbl', 'tabix', { name: 'out', defaultValue: 1 }, { name: 'aggr', type: 'int' }, { name: 'ord', type: 'int' }, { name: 'ft', type: 'int' },
        { name: 'oper', type: 'int' }, 'uor', 'userp', 'descr', 'def', { name: 'oper1', type: 'int' }, 'uor1', 'userp1', 'descr1', 'def1', 'filter2', 'uor2']
});