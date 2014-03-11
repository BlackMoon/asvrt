Ext.define('QB.view.alias.Edit', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Bargrid', 'QB.common.Updwnd'],
    alias: 'widget.aliasedit',    
    layout: { type: 'vbox', align: 'stretch' },
    title: 'Таблица',
    height: 480,
    width: 480,

    initComponent: function () {
        var me = this;

        me.store = Ext.create('Ext.data.Store', { model: 'QB.model.Alias' });

        me.form = Ext.widget('form',
        {
            defaults: { anchor: '100%', margin: '5' },
            items: [{
                xtype: 'textfield',
                name: 'id',
                hidden: true
            },
            {
                xtype: 'textarea',
                name: 'name',
                fieldLabel: 'Наименование',
                allowBlank: false
            },			
            {
                xtype: 'textarea',
                name: 'remark',
                fieldLabel: 'Псевдоним'                
            }]            
        });

        me.items = [me.form, {
            xtype: 'bargrid',
            title: 'Поля',            
            enableEdit: false,
            bbarConfig: { enable: false },
            tbarConfig: { enableSearch: false },            
            columns: [ { text: 'Наименование', dataIndex: 'name', flex: 1, editor: {} },
                       { text: 'Псевдоним', dataIndex: 'remark', flex: 2, editor: {} }],
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
            flex: 1,
            viewConfig: {
                getRowClass: function (row) {
                    if (row.get('err'))
                        return 'x-grid-row-red';
                }
            }
        }];
        me.callParent(arguments);
    },

    addRow: function (view) {
        var me = this;
        me.store.add(new QB.model.Alias());
        view.getPlugin('celleditor').startEdit(me.store.getCount() - 1, 0);
    },

    removeRows: function (view, recs) {
        view.store.remove(recs);
    }    
})