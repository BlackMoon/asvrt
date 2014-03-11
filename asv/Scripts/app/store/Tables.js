Ext.define('QB.store.Tables', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Table',    
    proxy: { url: '/admin/gettables' },
    sorters: ['name']    
});