Ext.define('QB.store.Aliases', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Alias',   
    proxy: { url: '/admin/getaliases' }
});