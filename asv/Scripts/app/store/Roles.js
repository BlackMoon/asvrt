Ext.define('QB.store.Roles', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Role',
    proxy: {        
        url: '/roles.xml',        
        reader: {
            type: 'xml',
            record: 'role'            
        }
    }
});