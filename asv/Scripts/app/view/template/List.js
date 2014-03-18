Ext.define('QB.view.template.List', {
    extend: 'QB.common.Bargrid',
    requires: ['QB.common.Spacenumcolumn', 'QB.common.Stylecolumn'],
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

        me.actions.edititem.setText('Открыть');
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
    },

    doEdit: function () {
        var me = this,
            rec = me.selected[0],
            isAuthor = (rec.get('authorid') == Auser.id),
            isReader = Auser.isinrole('READER') && !Auser.isinrole('EDITOR');
        enable = Auser.isinrole('EDITOR') || isAuthor || isReader;

        if (enable) {
            !isAuthor && isReader && rec.set('readonly', true);
            this.fireEvent('edititem', this, rec, this.selIndex);
        }
    }/*,

    doSelect: function (selected) {
        var me = this, enable = false,
            rec = selected[0],
            isAuthor = (rec.get('authorid') == Auser.id);

        if (me.enableEdit) {
            enable = Auser.isinrole('READER') || Auser.isinrole('EDITOR') || isAuthor;
            me.actions.edititem.setDisabled(!enable);
        }

        if (me.enableRemove) {
            enable = Auser.isinrole('ERASER') || isAuthor;
            me.actions.removeitem.setDisabled(!enable);
        }
    }*/
});