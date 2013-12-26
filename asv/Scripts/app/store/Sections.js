Ext.define('QB.store.Sections', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Section',
    proxy: { url: '/admin/getcatalogs' }
});