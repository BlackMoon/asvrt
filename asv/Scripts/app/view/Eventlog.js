Ext.define('QB.view.Eventlog', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.eventlog',
    cls: 'log',    
    enableAdd: false,
    enableEdit: false,
    enableRemove: false,
    enableContext: false,
    columns: [{ xtype: 'datecolumn', dataIndex: 'dt', text: 'Дата', format: 'd.m.Y H:i', width: 200 },
               { dataIndex: 'level', text: 'Тип' },
               { dataIndex: 'user', text: 'Пользователь', width: 200 },
               { dataIndex: 'host', text: 'Хост' },
               { dataIndex: 'message', text: 'Событие', flex: 1 }],    
    store: 'Logs',    
    

    initComponent: function () {
        var me = this;
        
        me.tbarConfig =  {
            enable: true,
            kind: 'custom',
            enableSearch: false,
            items: [{                
                text: 'Экспорт',
                iconCls: 'icon-txt',
                action: 'export'
            },
            '-',
            {
                xtype: 'checkboxfield',
                fieldLabel: 'Фильтр',
                labelWidth: 40,
                margin: '0 0 0 10',
                width: 120,
                listeners: { change: me.toggleFilter, scope: me }
            },
            {
                xtype: 'container',
                layout: { type: 'hbox', align: 'middle' },
                hidden: true,
                items: [{
                    xtype: 'datefield',
                    itemId: 'dateFrom',
                    fieldLabel: 'от:',
                    format: 'd.m.Y',
                    labelWidth: 20,                    
                    width: 120
                },
                {
                    xtype: 'timefield',
                    itemId: 'timeFrom',
                    format: 'H:i',
                    margin: '0 20 0 0',                    
                    width: 60
                },        
                {
                    xtype: 'datefield',
                    itemId: 'dateTo',
                    fieldLabel: 'до:',
                    format: 'd.m.Y',
                    labelWidth: 20,                    
                    width: 120
                },
                {
                    xtype: 'timefield',
                    itemId: 'timeTo',
                    format: 'H:i',                    
                    width: 60
                },
                {
                    xtype: 'textfield',
                    itemId: 'query',
                    fieldLabel: 'Пользователь / Событие',
                    labelWidth: 140,
                    width: 360,
                    margin: '0 0 0 10'
                },
                {
                    xtype: 'button',
                    cls: 'x-btn-default-small',
                    margin: '0 0 0 10',
                    text: 'OK',
                    action: 'filter'                    
                }]
            }]
        }

        me.callParent(arguments);

        delete me.store.proxy.extraParams;
        me.store.load();
    },      

    toggleFilter: function (field, newv) {
        var me = this;

        me.down('toolbar > container').setVisible(newv);

        if (!newv) {
            delete me.store.proxy.extraParams;
            me.store.loadPage(1);
        }
    }
})
