Ext.define('QB.common.Bartree', {
    extend: 'Ext.tree.Panel', 
    requires: [ 'QB.common.Searchfield' ],   
    alias: 'widget.bartree',
    columnLines: true,
    rootVisible: false,
    stateful: true,
    selected: [],    
    enableAdd: true,
    enableEdit: true,
    enableRemove: true,
    enableContext: true,    
    tbarConfig: { enable: true, kind: 'default', enableSearch: true, minChars: 3 },    

    constructor: function (cfg) {
        var me = this, obj;        

        obj = {};
        Ext.apply(obj, cfg.tbarConfig, me.tbarConfig);
        cfg.tbarConfig = obj;

        me.callParent(arguments);
    },

    initComponent: function () {
        var me = this, i;

        me.actions = {};

        if (me.enableAdd) {
            me.actions.additem = Ext.create('Ext.Action', {
                text: 'Добавить',
                iconCls: 'icon-add',
                handler: function () { me.fireEvent('additem', me) }
            });
            me.addEvents('additem');
        }

        if (me.enableEdit) {
            me.actions.edititem = Ext.create('Ext.Action', {
                text: 'Изменить',
                iconCls: 'icon-edit',
                handler: me.doEdit,
                disabled: true,
                scope: me
            });
            me.addEvents('edititem');
        }

        if (me.enableRemove) {
            me.actions.removeitem = Ext.create('Ext.Action', {
                text: 'Удалить',
                iconCls: 'icon-delete',
                handler: function () { me.fireEvent('removeitem', me, (me.selModel.mode == 'MULTI') ? me.selected : me.selected[0], me.selIx) },
                disabled: true
            });
            me.addEvents('removeitem');
        }
        
        var searchField;
        if (me.tbarConfig.enable) {
            me.tbar = { itemId: 'tbar', items: [] };
            if (me.tbarConfig.kind == 'default') {
                for (i in me.actions)
                    me.tbar.items.push(me.actions[i]);
            }

            me.tbarConfig.items && (me.tbar.items = me.tbar.items.concat(me.tbarConfig.items));
            if (me.tbarConfig.enableSearch) {
                searchField = Ext.widget('searchfield', { itemId: 'searchField', width: 300, minChars: me.tbarConfig.minChars });
                me.tbar.items.push({ xtype: 'tbfill' }, 'Поиск', searchField);
            }
        }
        me.callParent(arguments);

        if (searchField) {
            searchField.store = me.store;
            searchField.bindStore();
        }

        if (me.enableContext) {
            me.contextMenu = Ext.create('Ext.menu.Menu');
            for (i in me.actions)
                me.contextMenu.add(me.actions[i]);
        }

        me.on({
            beforedestroy: function () {
                me.store.filters.clear();
                me.store.loaded = false;
            },
            itemcontextmenu: function (view, rec, el, ix, e) {
                me.getSelectionModel().selectRange(ix, ix);
                if (me.enableContext) {
                    e.stopEvent();
                    me.contextMenu.showAt(e.getXY());
                    return false;
                }
            },            
            selectionchange: function (selmodel, selected) {
                me.selected = selected;                

                if (me.enableEdit)
                    me.actions.edititem.setDisabled(selected.length === 0);

                if (me.enableRemove)
                    me.actions.removeitem.setDisabled(selected.length === 0);
            }
        })
    },

    clearSearch: function () {
        var me = this,
            search = me.getDockedComponent('tbar').getComponent('searchField');

        if (search) {         
            search.setValue('');            
            search.hasSearch = false;
            search.triggerCell.item(0).setDisplayed(false);
            search.updateLayout();
        }
    }
})
