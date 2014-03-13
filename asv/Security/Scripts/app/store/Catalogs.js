Ext.define('QB.store.Catalogs', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Catalog',
    proxy: { url: '/admin/getcatalogs' }
});