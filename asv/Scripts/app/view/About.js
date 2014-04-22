Ext.define('QB.view.About', {
    extend: 'QB.common.Updwnd',
    alias: 'widget.about',
    title: 'О программе',
    btnClose: false,
    btnSave: false,
    width: 300,

    initComponent: function () {
        var me = this;

        me.items = [{
            xtype: 'container',            
            margin: '10',
            items: [{
                xtype: 'label',
                text: 'Конструктор запросов'
            },
            {
                xtype: 'displayfield',
                fieldLabel: 'Версия',
                fieldStyle: 'color: blue',
                labelWidth: 150,
                value: ver
            }]
        }];

        me.buttons = [{
            text: 'ОК',
            handler: me.close,
            scope: me
        }];

        me.callParent(arguments);
    }
})