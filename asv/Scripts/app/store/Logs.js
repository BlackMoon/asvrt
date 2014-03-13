Ext.define('QB.store.Logs', {
    extend: 'QB.store.Lstore',
    fields: ['event'],
    proxy: { url: '/admin/getlogs' }
});