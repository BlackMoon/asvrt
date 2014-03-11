Ext.define('QB.store.Conns', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Connection',
    proxy: { url: '/admin/getconns' }    
});