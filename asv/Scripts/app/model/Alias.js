Ext.define('QB.model.Alias', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'remark'],
    validations: [{ type: 'presence', field: 'name' }]
});