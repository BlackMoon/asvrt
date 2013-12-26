Ext.define('QB.view.tool.Tree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.tooltree',
    hideHeaders: true,
    rootVisible: false,
    stateful: true,
    stateId: 'conntree',
    store: 'Connections',
    title: 'Соединения',
    columns: [{ xtype: 'treecolumn', dataIndex: 'schema', flex: 1 }],
});