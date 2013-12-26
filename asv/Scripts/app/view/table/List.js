Ext.define('QB.view.table.List', {
    extend: 'QB.Common.Bargrid',
    alias: 'widget.tablelist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Наименование', dataIndex: 'name', minWidth: 300, flex: 1 }],
    stateful: false
});