Ext.define('QB.view.tool.Edit', {
    extend: 'Ext.container.Container',
    alias: 'widget.tooledit',
    cls: 'x-panel-body-default-framed',
    layout: { type: 'hbox', align: 'stretch' },

    initComponent: function(){
        var me = this;        

        me.items = [me.form = Ext.widget('form', {            
            width: 480,
            defaults: {xtype: 'fieldset', margin: '5', defaults: { labelWidth: 200 } },
            items: [{                
                title: 'Соединение',                
                items: [{
                    xtype: 'numberfield',
                    name: 'conntimeout',
                    fieldLabel: 'Время ожидания, с',
                    hideTrigger: true,
                    width: 280,
                    value: 300,
                    allowBlank: false
                }]
            },
            {                
                title: 'Запрос',                
                items: [{
                    xtype: 'numberfield',
                    name: 'itemsperpage',
                    fieldLabel: 'Записей на странице',
                    hideTrigger: true,
                    width: 280,
                    value: 50,
                    allowBlank: false
                }]
            }],
            buttons: [{
                text: 'Сохранить',
                iconCls: 'icon-save',
                action: 'save'
            }]
        })];        

        me.callParent(arguments);
    }
})