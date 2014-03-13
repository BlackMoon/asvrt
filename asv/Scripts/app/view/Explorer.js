Ext.define('QB.view.Explorer', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.explorer',
    hideHeaders: true,
    rootVisible: false,
    selNode: null,    
    stateful: true,       
    stateId: 'explorer',
    store: 'Dbs',
    title: 'Обозреватель',
    columns: [{ xtype: 'treecolumn', dataIndex: 'name', flex: 1 }],    
    tools: [{
        type: 'refresh',
        tooltip: 'Обновить',
        action: 'refresh'        
    },
    {
        type: 'gear',
        tooltip: 'Расположение',
        regionTool: true
    }],
    viewConfig: {
        plugins: {
            ptype: 'treeviewdragdrop',
            enableDrop: false
        }
    }
});