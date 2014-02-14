Ext.define('QB.store.Roles', {
    extend: 'Ext.data.Store',
    model: 'QB.model.Role',
    proxy: {
        type: 'ajax',
        url: '/roles.xml',
        actionMethods: { read: 'get' },
        reader: {
            type: 'xml',
            record: 'role'            
        }
    }
});