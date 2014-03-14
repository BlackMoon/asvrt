Ext.define('QB.view.query.List', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.querylist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Идентификатор', dataIndex: 'id', width: 200 },
              { text: 'Наименование', dataIndex: 'name', minWidth: 300, flex: 1 },              
              { text: 'Схема', dataIndex: 'conn', width: 200 }],
    features: [{ ftype: 'grouping', id: 'grouping', enableGroupingMenu: false, startCollapsed: true, groupHeaderTpl: '{name} (всего {rows.length})' }],    
    stateId: 'querygrid',
    store: 'Queries',
    tbarConfig: { enable: true, kind: 'default', enableSearch: true, minChars: 1 },

    initComponent: function () {
        var me = this;

        me.callParent(arguments);
        me.actions.edititem.setText('Открыть');

        me.store.load();
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
    },

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
    }       
});