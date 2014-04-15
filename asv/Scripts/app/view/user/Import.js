Ext.apply(Ext.form.field.VTypes, {
    xmlfile: function (val, field) {
        var fileName = /^.*\.xml$/i;
        return fileName.test(val);
    },
    xmlfileText: "Выберите файл XML",
    xmlfileMask: /[a-z_\.]/i
});

Ext.define('QB.view.user.Import', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Updwnd', 'QB.common.Xform'],
    alias: 'widget.userimport',
    btnSave: false,
    title: 'Импорт пользователей',  
    width: 440,

    initComponent: function () {
        var me = this;

        me.ffield = Ext.widget('filefield', { name: 'file', fieldLabel: 'Файл', labelWidth: 150, margin: '5', allowBlank: false, vtype: 'xmlfile' });

        me.form = Ext.widget('xform', {
            defaults: { anchor: '100%', labelWidth: 150, margin: 5 },
            items: [ me.ffield,
            {
                xtype: 'checkboxfield',
                name: 'serverlogin',
                boxLabel: '&nbspАвторизоваться на сервере БД',
                checked: true,
                inputValue: 1,
                uncheckedValue: 0,
                margin: '0 5 12 5',
                listeners: { change: me.toggleAuth, scope: me }
            },
            {
                xtype: 'combo',
                name: 'conn',
                itemId: 'conn',
                store: 'Conns',
                fieldLabel: 'База для авторизации',
                displayField: 'name',
                valueField: 'name',
                allowBlank: false
            }]
        })

        me.items = [me.form];
        me.buttons = [{ text: 'OK', iconCls: 'icon-go', action: 'importusers' }];       

        me.callParent(arguments);
    },

    toggleAuth: function (field, newv) {
        this.form.getComponent('conn').setDisabled(!newv);
    }
});