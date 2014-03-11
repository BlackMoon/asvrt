Ext.define('QB.view.func.List', {
    extend: 'QB.common.Bargrid',    
    alias: 'widget.funclist',
    columns: [{ xtype: 'rownumberer' },
              { text: 'Наименование', dataIndex: 'name', minWidth: 200, flex: 1 },
              { text: 'Параметров', dataIndex: 'args', align: 'right' }],
    stateId: 'funcgrid',
    store: 'Funcs',    

    initComponent: function () {
        this.callParent(arguments);
        this.store.load();
    }
});