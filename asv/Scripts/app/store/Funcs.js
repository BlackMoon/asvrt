Ext.define('QB.store.Funcs', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Func',
    proxy: { url: '/admin/getfuncs', extraParams: { body: 0 } }
});