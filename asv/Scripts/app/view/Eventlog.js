Ext.define('QB.view.Eventlog', {
    extend: 'QB.common.Bargrid',
    alias: 'widget.eventlog',
    hideHeaders: true,
    enableAdd: false,
    enableEdit: false,
    enableRemove: false,
    enableContext: false,
    columns: [{ dataIndex: 'event', flex: 1 }],        
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
