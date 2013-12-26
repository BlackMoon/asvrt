Ext.define('QB.view.template.List', {
    extend: 'QB.Common.Bargrid',
    requires: ['QB.Common.Spacenumcolumn', 'QB.Common.Stylecolumn'],
    alias: 'widget.templatelist',
    columns: [{ xtype: 'rownumberer' },
               { text: 'Наименование', dataIndex: 'name', width: 300 },
               { xtype: 'stylecolumn', text: 'Файл', dataIndex: 'fname', minWidth: 400, flex: 1, cstyle: 'color: blue; cursor: pointer; text-decoration: underline' },
               { xtype: 'spacenumcolumn', text: 'Размер', dataIndex: 'sz', format: '0,000', suffix: ' Кб'}],
    stateId: 'tplgrid',
    store: 'Templates',    

    initComponent: function () {
        var me = this;
        me.callParent(arguments);
        me.store.load();

        me.on({ cellclick: function (view, td, cellIx, rec) { (cellIx == 2) && me.doDownload(rec); } });
    },

    doDownload: function (rec) {
        var me = this;

        me.el.mask('Формируется ссылка', 'x-mask-loading'),
        Ext.Ajax.request({
            method: 'get',
            url: '/report/gettpl',
            params: { id: rec.get('id') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);

                if (obj.success) {
                    window.location = obj.link;
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });

                me.el.unmask();
            },
            failure: function (response) { me.el.unmask(); }
        })
    }
});