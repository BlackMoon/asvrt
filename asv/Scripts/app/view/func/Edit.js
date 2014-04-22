Ext.define('QB.view.func.Edit', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Bargrid', 'QB.common.Updwnd', 'QB.common.Xform'],
    alias: 'widget.funcedit',    
    title: 'Функция',
    height: 280,
    width: 480,

    initComponent: function () {
        var me = this,
            ftcombo = new QB.common.Labelcombo({ labels: ['Логический', 'Дата', 'Число', 'Строка'] });

        me.store = Ext.create('Ext.data.Store', { model: 'QB.model.Fparam' });

        me.form = Ext.widget('xform',
        {
            defaults: { anchor: '100%', labelWidth: 150, margin: '5' },
            items: [{
                xtype: 'textfield',
                name: 'id',
                hidden: true
            },
            {
                xtype: 'textfield',
                name: 'name',
                fieldLabel: 'Наименование',
                allowBlank: false
            },            
            {
                xtype: 'textarea',
                name: 'body',
                fieldLabel: 'Тело',
                height: 100,
                allowBlank: false
            }]
        });

        me.items = [{
            xtype: 'tabpanel',
            defaults: { layout: 'fit' },
            items: [{
                title: 'Основные',
                items: [me.form]
            },
            {
                title: 'Параметры',
                items: [{
                    xtype: 'bargrid',                   
                    enableEdit: false,
                    bbarConfig: { enable: false },
                    tbarConfig: { enableSearch: false },
                    columns: [ { text: 'Описание', dataIndex: 'descr', flex: 1, editor: {} },
                               {
                                   text: 'Тип',
                                   dataIndex: 'ft',
                                   editor: ftcombo,
                                   renderer: me.comboRenderer(ftcombo)
                               }],
                    selModel: { mode: 'MULTI' },
                    listeners: { additem: me.addRow, removeitem: me.removeRows },
                    plugins: [{
                        pluginId: 'celleditor',
                        ptype: 'cellediting',
                        listeners: {
                            edit: function (editor, e) { e.record.commit(); }
                        }
                    }],
                    store: me.store,                    
                    viewConfig: {
                        plugins: { ptype: 'gridviewdragdrop' }
                    }
                }]
            }]
        }];
        me.callParent(arguments);
    },

    addRow: function (view) {
        var me = this;
        me.store.add(new QB.model.Fparam({ ft: 3 }));
        view.getPlugin('celleditor').startEdit(me.store.getCount() - 1, 0);
    },

    removeRows: function (view, recs) {
        view.store.remove(recs);
    },

    comboRenderer: function(combo){
        return function(v){
            if (v !== '') {
                var rec = combo.findRecord(combo.valueField, v);
                if (rec) 
                    return rec.get(combo.displayField);
            }
        }
    }
})