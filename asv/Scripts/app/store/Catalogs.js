Ext.define('QB.store.Catalogs', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Catalog',
    proxy: { url: '/admin/getcatalogs' }
});