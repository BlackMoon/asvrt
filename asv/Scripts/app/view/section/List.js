Ext.define('QB.view.section.List', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.sectionlist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Наименование', dataIndex: 'name', minWidth: 300, flex: 1 },
              { text: 'Схема', dataIndex: 'conn', width: 200 }],
    stateId: 'sectiongrid',
    store: 'Sections',    

    initComponent: function () {
        this.callParent(arguments);
        this.store.load();
    }
});