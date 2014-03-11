Ext.define('QB.view.section.Tlist', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Bargrid', 'QB.common.Updwnd'],
    alias: 'widget.sectiontlist',    
    btnSave: false,
    title: 'Добавить',
    height: 480,
    width: 520,

    initComponent: function () {
        var me = this;

        me.grid = Ext.widget('bargrid', {
            store: 'Tables',
            enableAdd: false,
            enableEdit: false,
            enableRemove: false,
            enableContext: false,
            selModel: { mode: 'MULTI' },
            columns: [{ dataIndex: 'name', menuDisabled: true, flex: 1 }, { dataIndex: 'rem', menuDisabled: true, flex: 1 }],
            listeners: {
                selectionchange: function (selmodel, selected) {
                    this.selected = selected;
                    me.addbtn.setDisabled(selected.length === 0);
                }
            }
        });

        me.items = [me.grid];
        
        me.buttons = [me.addbtn = Ext.widget('button', {
            text: 'Добавить',
            iconCls: 'icon-table',
            action: 'add',
            disabled: true
        })];

        me.callParent(arguments);        
    }
})