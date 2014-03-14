Ext.define('QB.model.Query', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', { name: 'grp', type: 'string' }, 'conn', 'drv', 'schema', 'authorid']
});