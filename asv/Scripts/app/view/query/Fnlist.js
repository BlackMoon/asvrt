Ext.define('QB.view.query.Fnlist', {
    extend: 'QB.Common.Updwnd',
    requires: ['QB.Common.Bargrid', 'QB.Common.Updwnd'],
    alias: 'widget.queryfnlist',    
    btnSave: false,
    title: 'Вставить',
    height: 480,
    width: 520,

    initComponent: function () {
        var me = this;               

        me.items = [{
            xtype: 'bargrid',                       
            bbarConfig: { enable: false },
            tbarConfig: { enableSearch: false },
            columns: [ { text: 'Функция', dataIndex: 'name', flex: 1 },
                       { text: 'Псевдоним', dataIndex: 'alias' },
                       { xtype: 'checkcolumn', text: 'Выход', dataIndex: 'out', disabled: true, cls: 'x-toggle', disabledCls: '', align: 'center', width: 80 },
                       { xtype: 'checkcolumn', text: 'Фильтр', dataIndex: 'filter', disabled: true, cls: 'x-toggle', disabledCls: '', align: 'center', width: 80 },
                       { xtype: 'checkcolumn', text: 'Сортировка', dataIndex: 'ord', disabled: true, cls: 'x-toggle', disabledCls: '', align: 'center', width: 80 }],
            listeners: { additem: me.addUfunc, edititem: me.editUfunc, removeitem: me.deleteUfunc },
            store: me.store,            
            viewConfig: {
                plugins: { ptype: 'gridviewdragdrop' }
            }
        }];

        me.buttons = [{ text: 'OK', iconCls: 'icon-go', action: 'add' }];
        me.callParent(arguments);
    },

    addUfunc: function () {
        Ext.widget('queryfnedit', { upd: false });
    },

    deleteUfunc: function (view, rec, ix) {        
        Ext.Msg.confirm('Внимание', 'Удалить функцию <b>' + rec.get('name') + '</b>?', function (btn) {
            (btn == 'yes') && view.store.removeAt(ix); 
        })
    },

    editUfunc: function (grid, rec) {
        var view = Ext.widget('queryfnedit'),
            ufunc = { tp: null };
        
        if (rec.get('fnid')) {
            view.combo.store.load({ params: { query: rec.get('name') } });
            ufunc.tp = 1;
        }
        else
            delete rec.data['fnid'];
        
        view.form.loadRecord(rec);
        view.form.getForm().setValues(ufunc);
    }
})