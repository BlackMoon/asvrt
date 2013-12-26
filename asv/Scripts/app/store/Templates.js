Ext.define('QB.store.Templates', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Template',
    proxy: { url: '/report/gettemplates' }
});