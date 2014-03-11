Ext.define('QB.store.Sections', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Section',
    proxy: { url: '/admin/getcatalogs' }
});