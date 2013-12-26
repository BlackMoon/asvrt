Ext.define('QB.store.Users', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.User',    
    proxy: { url: '/admin/getusers' }    
});