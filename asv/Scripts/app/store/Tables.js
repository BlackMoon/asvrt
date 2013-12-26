Ext.define('QB.store.Tables', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Table',    
    proxy: { url: '/admin/gettables' },
    sorters: ['name']    
});