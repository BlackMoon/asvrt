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
            items: [{                
                text: 'Экспорт',
                iconCls: 'icon-txt',
                action: 'export'
            },
            '-',
            {
                xtype: 'checkboxfield',
                fieldLabel: 'Фильтр',
                labelWidth: 50,
                margin: '0 10 0 10',
                listeners: {
                    change: me.toggleFilter,
                    scope: me
                }
            },
            {
                xtype: 'container',
                layout: { type: 'hbox' },
                defaults: { margin: '0 0 0 10' },
                hidden: true,
                items: [{
                    xtype: 'datefield',
                    itemId: 'dateFrom',
                    fieldLabel: 'от',
                    format: 'd.m.Y',
                    labelWidth: 20,
                    width: 120                    
                },
                {
                    xtype: 'timefield',
                    itemId: 'timeFrom',
                    format: 'H:i',
                    width: 60,
                    margin: '0 0 0 3'
                },
                {
                    xtype: 'datefield',
                    itemId: 'dateTo',
                    fieldLabel: 'до',
                    format: 'd.m.Y',
                    labelWidth: 20,
                    width: 120                    
                },
                {
                    xtype: 'timefield',
                    itemId: 'timeTo',
                    format: 'H:i',
                    width: 60,
                    margin: '0 0 0 3'
                },
                {
                    xtype: 'textfield',
                    itemId: 'query',
                    fieldLabel: 'Пользователь / Событие',
                    labelWidth: 140,
                    width: 360                    
                },
                {
                    xtype:'button',
                    text: 'ОК',
                    cls: 'x-btn-default-small',                    
                    action: 'filter'
                }]

            }]
        }

        me.callParent(arguments);
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
