Ext.define('QB.store.Logs', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Log',
    proxy: { url: '/admin/getlogs' }
});