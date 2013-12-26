Ext.define('QB.view.query.Add', {
    extend: 'QB.Common.Updwnd',
    requires: ['QB.Common.Bartree', 'QB.Common.Updwnd', 'Ext.ux.tree.Filter'],
    alias: 'widget.queryadd',    
    btnSave: false,
    checked: 0,
    layout: 'border',
    maximizable: true,
    title: 'Добавить таблицу',
    height: 520,
    width: 640,    

    initComponent: function () {
        var me = this;

        me.items = [me.combo = Ext.widget('combobox', {
            fieldLabel: 'Схема',
            store: 'Qdbs',
            editable: false,
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            region: 'north',
            labelWidth: 150,            
            margin: '5 5 5 5'            
        }),
        me.tree = Ext.widget('bartree', {
            store: me.store,
            enableAdd: false,
            enableEdit: false,
            enableRemove: false,
            enableContext: false,            
            tbarConfig: { enableSearch: true },
            columns: [{ xtype: 'treecolumn' }, { dataIndex: 'rem', flex: 1 }, { dataIndex: 'name', flex: 1 }],
            region: 'center',
            stateId: 'tablestree',
            listeners: { checkchange: me.onCheckChange, scope: me },
            plugins: [{
                ptype: 'treefilter',
                allowParentFolders: true,
                collapseOnClear: false
            }]
        })];        
        
        me.buttons = [{                        
            text: 'Обновить',
            iconCls: Ext.baseCSSPrefix + 'tbar-loading',            
            action: 'refresh'
        },
        me.addbtn = Ext.widget('button', { text: 'Добавить', iconCls: 'icon-table', action: 'add', disabled: true })];

        me.callParent(arguments);
        me.store.ui = me.tree;
    },

    onCheckChange: function (node, checked) {
        var me = this;

        if (checked) 
            node.cascadeBy(function (nd) { nd.set('checked', checked); me.checked++; });
        else {
            me.checked--;
            node = node.parentNode;            
            me.togglePNode(node, checked);
        }

        me.addbtn.setDisabled(me.checked == 0);
    },    

    doSetValue: function (v) {
        var combo = this.combo;

        if (combo.store.getCount() > 0) {
            (!v) && (v = combo.store.getAt(0).getData());
            combo.setValue(v[combo.valueField]);
        }        
    },

    togglePNode: function (node, checked) {
        var me = this;
        if (!node.isRoot()) {
            node.get('checked') && me.checked--;

            node.set('checked', checked);
            me.togglePNode(node.parentNode, checked);
        }
    }
})