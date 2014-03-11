Ext.define('QB.view.catalog.List', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.cataloglist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Наименование', dataIndex: 'name', minWidth: 300, flex: 1 },
              { text: 'Схема', dataIndex: 'conn', width: 200 }],
    stateId: 'cataloggrid',
    store: 'Catalogs',    

    initComponent: function () {
        this.callParent(arguments);
        this.store.load();
    }
});