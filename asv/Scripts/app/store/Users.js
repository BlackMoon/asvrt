Ext.define('QB.store.Users', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.User',    
    proxy: { url: '/admin/getusers' }    
});