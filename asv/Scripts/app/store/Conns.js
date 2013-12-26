Ext.define('QB.store.Conns', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Connection',
    proxy: { url: '/admin/getconns' }    
});