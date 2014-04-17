Ext.apply(Ext.form.field.VTypes, {
    htmlfile: function (val, field) {
        var fileName = /^.*\.html$/i;
        return fileName.test(val);
    },
    htmlfileText: "Выберите файл схемы ПТК АСВ (*.html)",
    htmlfileMask: /[a-z_\.]/i
});

Ext.define('QB.view.alias.List', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.aliaslist',    
    columns: [{ xtype: 'rownumberer', resizable: true, width: 28 },
               { text: 'Наименование', dataIndex: 'name', minWidth: 200, flex: 1 },
               { text: 'Псевдоним', dataIndex: 'remark', minWidth: 200, flex: 2 }],
    store: 'Aliases',

    initComponent: function () {
        var me = this;            

        me.tbarConfig = {
            enable: true,
            enableSearch: true,
            kind: 'default',
            minChars: 3,
            items: ['-', {
                xtype: 'form',
                border: 0,
                frame: false,
                height: 24,
                width: 70,
                tbar: [{
                    xtype: 'filefield',
                    buttonOnly: true,
                    buttonConfig: { iconCls: 'icon-html' },
                    buttonText: 'Импорт',
                    name: 'file',
                    vtype: 'htmlfile',
                    listeners: { change: me.doUpload, scope: me }
                }]
            }]
        }        

        me.callParent(arguments);
        me.store.load();
    },

    doUpload: function (fb, v) {
        var me = this,
            form = fb.up('form');

        try
        {
            if (!fb.isValid()) throw fb.getErrors();

            me.setLoading('Импорт');
            form.getForm().submit({
                url: 'admin/importaliases',
                failure: function (f, a) {
                    me.setLoading(false);
                    Ext.MessageBox.show({
                        title: 'Внимание',
                        msg: a.result.message,
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.WARNING
                    });                
                },
                success: function (f, a) {
                    me.setLoading(false);
                    me.store.loadPage(1);                
                    Ext.MessageBox.show({
                        title: 'Информация',
                        msg: 'Импортировано ' + a.result.message + ' псевдонимов',
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.INFO
                    });

                    me.store.loadPage(1);
                }
            });
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    }
});