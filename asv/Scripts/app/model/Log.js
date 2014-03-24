Ext.define('QB.model.Log', {
    extend: 'Ext.data.Model',
    fields: ['id', { name: 'dt', type: 'date', dateFormat: 'd.m.Y H:i' }, 'level', 'user', 'host', 'message']
});