Ext.define('QB.store.Uconns', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Connection',
    proxy: { url: '/main/getconns' }
});