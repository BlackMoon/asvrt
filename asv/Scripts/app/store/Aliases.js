Ext.define('QB.store.Aliases', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Alias',   
    proxy: { url: '/admin/getaliases' }
});