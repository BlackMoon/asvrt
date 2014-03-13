Ext.define('QB.store.Templates', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Template',
    proxy: { url: '/report/gettemplates' }
});