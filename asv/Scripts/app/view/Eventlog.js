Ext.define('QB.view.Eventlog', {
    extend: 'QB.common.Bargrid',
    alias: 'widget.eventlog',
    cls: 'log',    
    enableAdd: false,
    enableEdit: false,
    enableRemove: false,
    enableContext: false,
    columns: [ { xtype: 'datecolumn', text: 'Дата', dataIndex: 'dt', format: 'd.m.Y H:i', width: 200 },
               { text: 'Тип', dataIndex: 'level' },
               { text: 'Пользователь', dataIndex: 'user' },
               { text: 'Хост', dataIndex: 'host' },
               { text: 'Событие', dataIndex: 'message', flex: 1 }],
    store: 'Logs',    

    initComponent: function () {
        var me = this;

        me.tbarConfig = {
            enable: true,
            kind: 'custom',
            enableSearch: false,
            items: [{                
                text: 'Экспорт',
                iconCls: 'icon-txt',
                action: 'export'
            }]
        }

        me.callParent(arguments);
        me.store.load();
    }
})
