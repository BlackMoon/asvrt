Ext.define('QB.view.user.List', {
    extend: 'QB.common.Bargrid',
    requires: ['QB.common.Imagecolumn'],
    alias: 'widget.userlist',
    columns: [{ xtype: 'rownumberer', resizable: true, width: 28 },
               { text: 'Логин', dataIndex: 'login', width: 200 },
               { text: 'Фамилия', dataIndex: 'lastname', width: 200 },
               { text: 'Имя', dataIndex: 'firstname', width: 200 },
               { text: 'Отчество', dataIndex: 'middlename', width: 200 },
               { xtype: 'imagecolumn', text: 'Блокировка', dataIndex: 'isapproved', img: '/content/ext-theme-classic/images/grid/hmenu-lock.gif' },
               { xtype: 'imagecolumn', text: 'Администратор', dataIndex: 'isadmin', img: '/content/admin16.png' }],
    stateId: 'usrgrid',
    store: 'Users',

    initComponent: function () {
        var me = this;

        me.tbarConfig = {
            enable: true,
            enableSearch: true,
            kind: 'default',
            minChars: 3,
            items: ['-', 
            {
                text: 'Импорт',
                iconCls: 'icon-xml',
                action: 'import'
            }]
        }

        me.callParent(arguments);
        me.store.load();
    },

    doUpload: function (fb, v) {
        var me = this,
            form = fb.up('form');

        me.setLoading(true);
        form.getForm().submit({
            url: 'admin/importusers',
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
                    msg: 'Импортировано ' + a.result.message + ' пользователей',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.INFO
                });
            }
        });    
    }

});