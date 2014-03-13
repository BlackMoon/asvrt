Ext.define('QB.store.Uconns', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Connection',
    proxy: { url: '/main/getconns' }
});