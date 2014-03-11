Ext.define('QB.view.conn.List', {
    extend: 'QB.common.Bargrid',
    requires: ['QB.common.Labelcolumn'],   
    alias: 'widget.connlist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Наименование', dataIndex: 'name', minWidth: 200, flex: 1 },
              { xtype: 'labelcolumn', text: 'Драйвер', dataIndex: 'driver', minWidth: 200, flex: 1, labels: drvLabels }],                   
    stateId: 'conngrid',
    store: 'Conns',
    tbarConfig: { enable: true, kind: 'default', enableSearch: false },

    initComponent: function () {
        this.callParent(arguments);
        this.store.load();
    }
});