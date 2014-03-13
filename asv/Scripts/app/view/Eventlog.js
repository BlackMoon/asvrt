Ext.define('QB.view.Eventlog', {
    extend: 'QB.common.Bargrid',
    alias: 'widget.eventlog',
    columns: [{ dataIndex: 'event', flex: 1 }],
    hideHeaders: true,
    enableAdd: false,
    enableEdit: false,
    enableRemove: false,
    enableContext: false,

    store: 'Logs',
    tbarConfig: {
        kind: 'custom',
        enableSearch: false,
        items: [{            
            text: 'Экспорт',
            iconCls: 'icon-txt',            
            action: 'export'
        }]
    },

    initComponent: function () {
        var me = this;

        me.callParent(arguments);
        me.store.load();
    }
})