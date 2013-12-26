Ext.define('QB.store.Queries', {
    extend: 'QB.Store.Lstore',
    model: 'QB.model.Query',
    groupField: 'grp',
    proxy: { url: '/main/getqueries' },
    remoteFilter: false,
    sorters: ['rem'],
    filterFn: function (f) {
        var rx = new RegExp(f.value, 'i');
        this.filterBy(function (r) {
            return (r.get('id') == f.value || rx.test(r.get('name')));
        })
    }
});