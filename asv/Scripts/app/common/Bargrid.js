Ext.define('QB.overrides.view.Table', {
    override: 'Ext.view.Table',
    getRecord: function (node) {
        node = this.getNode(node);
        if (node)
            return this.dataSource.data.get(node.getAttribute('data-recordId'));
    },
    indexInStore: function (node) {
        node = this.getNode(node, true);

        if (!node && node !== 0)
            return -1;

        return this.dataSource.indexOf(this.getRecord(node));
    }
});

Ext.define('QB.common.Bargrid', {
    extend: 'Ext.grid.Panel', 
    requires: [ 'QB.common.Searchfield' ],   
    alias: 'widget.bargrid',
    columnLines: true,    
    selected: [],
    selIx: -1,
    stateful: true,
    enableAdd: true,
    enableEdit: true,
    enableRemove: true,
    enableContext: true,
    bbarConfig: { },
    tbarConfig: { },

    constructor: function (cfg) {
        var me = this,
            basebbar = { enable: true, kind: 'default' },
            basetbar = { enable: true, kind: 'default', enableSearch: true, minChars: 3 };

        cfg.bbarConfig = cfg.bbarConfig ? Ext.applyIf(cfg.bbarConfig, basebbar) : Ext.applyIf(me.bbarConfig, basebbar);
        cfg.tbarConfig = cfg.tbarConfig ? Ext.applyIf(cfg.tbarConfig, basetbar) : Ext.applyIf(me.tbarConfig, basetbar);

        me.callParent(arguments);
    },

    initComponent: function () {
        var me = this, i = 0; 
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

        me.bbarConfig.enable && (me.bbar = new Ext.toolbar.Paging({
            itemId: 'bbar',
            store: me.store, displayInfo: true,
            emptyMsg: 'Нет записей',
            displayMsg: 'Выбрано {0} - ' + ((me.bbarConfig.kind == 'default') ? '{1}' : '{2}') + ' из {2}',
            kind: me.bbarConfig.kind,
            items: me.bbarConfig.items
        }));

        var searchField;
        if (me.tbarConfig.enable) {
            me.tbar = { itemId: 'tbar', items: [] };
            if (me.tbarConfig.kind == 'default') {                
                for (i in me.actions)
                    me.tbar.items.push(me.actions[i]);
            }
            
            me.tbarConfig.items && (me.tbar.items = me.tbar.items.concat(me.tbarConfig.items));
            if (me.tbarConfig.enableSearch) { 
                searchField = Ext.widget('searchfield', { itemId: 'searchField', width: 300, minChars: me.tbarConfig.minChars } );
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
            itemdblclick: me.doEdit,
            selectionchange: function (selmodel, selected) {
                me.selected = selected;
                me.selIx = me.store.indexOf(selected[0]);

                me.doSelect(selected);
            }
        })
    },

    doEdit: function () { this.fireEvent('edititem', this, this.selected[0], this.selIndex) },
    doSelect: function (selected) {
        var me = this;
        if (me.enableEdit)
            me.actions.edititem.setDisabled(selected.length === 0);

        if (me.enableRemove)
            me.actions.removeitem.setDisabled(selected.length === 0);
    }
});