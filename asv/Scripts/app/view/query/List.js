Ext.define('QB.view.query.List', {
    extend: 'QB.Common.Bargrid',    
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
        this.callParent(arguments);
        this.store.load();
    }
});