Ext.define('QB.view.catalog.Edit', {
    extend: 'QB.Common.Updwnd',
    requires: ['QB.Common.Bargrid', 'QB.Common.Bartree', 'QB.Common.Updwnd' ],
    layout: { type: 'vbox', align: 'stretch' },
    alias: 'widget.catalogedit',
    btns: ['add', 'addall'],
    btnsText: { add: 'Добавить', addall: 'Добавить все' },
    maximizable: true,
    title: 'Каталог',
    height: 520,
    width: 720,

    initComponent: function () {
        var me = this, baseCSSPrefix = Ext.baseCSSPrefix, buttons = [];            

        me.btns.forEach(function (name) {
            buttons.push({
                xtype: 'button',
                itemId: name,
                tooltip: me.btnsText[name],
                height: 30,
                width: 30,
                scale: 'medium',
                handler: me['on' + Ext.String.capitalize(name) + 'BtnClick'],
                cls: baseCSSPrefix + 'form-itemselector-btn',
                iconCls: baseCSSPrefix + 'form-itemselector-' + name,
                disabled: true,
                scope: me
            });
            //div separator to force vertical stacking
            buttons.push({ xtype: 'component', height: 3, width: 1, style: 'font-size:0;line-height:0' });
        });

        me.tstore = Ext.create('Ext.data.TreeStore', {
            model: 'QB.model.Table',
            defaultRootId: '',
            defaultRootProperty: 'data',            
            root: {
                data: [],
                expanded: true                
            },
        });        

        me.form = Ext.widget('form',
        {
            defaults: { anchor: '100%', margin: '5' },
            items: [{
                xtype: 'textfield',
                name: 'id',
                hidden: true
            },
            {
                xtype: 'fieldcontainer',
                layout: 'hbox',
                items: [{
                    xtype: 'textfield',
                    name: 'name',
                    fieldLabel: 'Наименование',
                    labelWidth: 150,
                    flex: 2,
                    allowBlank: false,
                    margin: '0 40 0 0'
                },
                me.combo = Ext.widget('combo',
                {                
                    name: 'conn',
                    store: 'Conns',
                    fieldLabel: 'База',
                    labelWidth: 60,
                    flex: 1,
                    editable: false,
                    displayField: 'name',
                    valuefield: 'name',
                    allowBlank: false,
                    listeners: { change: me.updateTlist, scope: me }
                })]
            }]
        });

        me.items = [me.form,
        {
            xtype: 'container',
            layout: { type: 'hbox', align: 'stretch' },
            items: [
            me.tree = Ext.widget('bartree', {                
                store: me.tstore,
                enableEdit: false,
                hideHeaders: true,
                stateful: false,
                tbarConfig: { enableSearch: false },
                columns: [{ xtype: 'treecolumn', dataIndex: 'name', flex: 1, getEditor: me.getEditor }],
                listeners: {
                    additem: me.addNode,
                    removeitem: me.deleteNode,
                    selectionchange: function (selmodel, selected) {
                        me.tree.selected = selected;                        
                        me.tree.actions.removeitem.setDisabled(selected.length === 0);

                        me.onSelChange();
                        return false;
                    },
                    scope: me
                },
                
                plugins: [{                    
                    pluginId: 'celleditor',
                    ptype: 'cellediting',
                    listeners: {
                        edit: function (editor, e) { e.record.commit(); }
                    }
                }],
                viewConfig: {
                    plugins: {
                        ptype: 'treeviewdragdrop',
                        ddGroup: 'ddGroup'
                    },
                    listeners: {
                        nodedragover: function (targetNode, position, dragData) {                            
                            if (dragData.records.length > 0) {
                                var rnd = targetNode.parentNode;

                                if (dragData.view.xtype == 'gridview')
                                    return (position == 'append');
                                
                                else {
                                    // treeview -> leafs only append
                                    if (rnd.isRoot()) {
                                        return (!dragData.records[0].isLeaf() || position == 'append');
                                    }
                                    else
                                        return true;
                                }
                            }
                            
                        },
                        beforedrop: function (node, data, overmodel) {                            
                            if (data.view.xtype == 'gridview') {
                                var i = 0, child;
                                                                
                                while (i < data.records.length) {
                                    var rec = data.records[i];

                                    child = overmodel.findChild('name', rec.get('name'));
                                    if (child) 
                                        data.records.splice(i, 1)                                    
                                    else {
                                        rec.set('leaf', true);
                                        i++;
                                    }
                                }
                            }
                        }
                    }
                },
                flex: 2
            }),
            {
                xtype: 'container',
                margins: '0 2 0 4',
                width: 32,
                layout: { type: 'hbox', align: 'middle' },
                items: [{ xtype: 'container', items: buttons }],
            },
            me.grid = Ext.widget('bargrid', {
                store: 'Tables',
                columnLines: false,
                enableAdd: false,
                enableEdit: false,
                enableRemove: false,
                enableContext: false,
                selModel: { mode: 'MULTI' },
                columns: [{ xtype: 'rownumberer', resizable: true, width: 28 },
                            { text: 'Наименование', dataIndex: 'name', menuDisabled: true, flex: 1 },
                            { text: 'Псевдоним', dataIndex: 'rem', menuDisabled: true, flex: 1 }],
                selModel: { mode: 'MULTI' },
                listeners: {
                    itemdblclick: me.onAddBtnClick,
                    selectionchange: function (selmodel, selected) {
                        me.grid.selected = selected;
                        me.onSelChange();
                        return false;
                    },
                    scope: me
                },
                viewConfig: {
                    copy: true,
                    plugins: {
                        ptype: 'gridviewdragdrop',
                        ddGroup: 'ddGroup',
                        dragText: 'Добавить',
                        onViewRender: function (view) {
                            var me = this, scrollEl;

                            if (me.enableDrag) {
                                if (me.containerScroll) 
                                    scrollEl = view.getEl();
                                
                                me.dragZone = new Ext.view.DragZone({
                                    view: view,
                                    ddGroup: me.dragGroup || me.ddGroup,
                                    dragText: me.dragText,
                                    containerScroll: me.containerScroll,
                                    scrollEl: scrollEl
                                });
                            }

                            if (me.enableDrop) {
                                me.dropZone = new Ext.grid.ViewDropZone({
                                    view: view,
                                    ddGroup: me.dropGroup || me.ddGroup,
                                    handleNodeDrop: function (data) {
                                        if (!data.copy) {
                                            data.records.forEach(function (rec) {
                                                rec.remove();
                                            });
                                        }                                        
                                    }
                                });
                            }
                        }
                    }
                },
                flex: 3
            })],
            flex: 1
        }];
        
        me.callParent(arguments);
        me.grid.store.on({
            load: function () {
                me.grid.selected = [];
                me.onSelChange();
            }
        });
    },

    onAddBtnClick: function () {
        var me = this;

        if (me.tree.selected.length > 0) {
            var nd = me.tree.selected[0]

            if (!nd.isRoot()) {
                me.el.mask('Добавление', 'x-mask-loading');

                var child, name;
                me.grid.selected.forEach(function (rec) {
                    name = rec.get('name');
                    child = nd.findChild('name', name);
                    !child && nd.appendChild(new QB.model.Table({ name: name, leaf: true }));
                })
                nd.expand();

                me.el.unmask();
            }
        }
    },

    onAddallBtnClick: function () {
        var me = this;

        if (me.tree.selected.length > 0) {
            var nd = me.tree.selected[0]

            if (!nd.isRoot()) {
                me.el.mask('Добавление', 'x-mask-loading');

                var child, name;
                me.grid.store.each(function (rec) {
                    name = rec.get('name');
                    child = nd.findChild('name', name);
                    !child && nd.appendChild(new QB.model.Table({ name: name, leaf: true }));
                })
                nd.expand();

                me.el.unmask();
            }
        }
    },

    onSelChange: function () {
        var me = this,
            btnAdd = me.down('button[itemId=add]'),
            btnAddAll = me.down('button[itemId=addall]'),
            nd, rows = me.grid.selected;

        if (me.tree.selected.length > 0) 
            nd = me.tree.selected[0];        

        btnAdd && btnAdd.setDisabled(rows.length === 0 || !nd || nd.isRoot() || nd.isLeaf());
        btnAddAll && btnAddAll.setDisabled(!nd || nd.isRoot() || nd.isLeaf());

        return false;
    },

    addNode: function(view){
        var me = this, nd,
            pnd = view.selected[0] || view.getRootNode();

        pnd.expand();        

        nd = pnd.appendChild(new QB.model.Table({ name: 'Раздел' }));
        view.getPlugin('celleditor').startEdit(nd, 0);               
    },

    addTables: function () {
        var me = this;
        
        try
        {
            if (!me.combo.validate()) throw 'Выберите базу!';

            var rec = me.combo.findRecord('name', me.combo.getValue()),
                view = Ext.widget('sectiontlist', { parent: me }),
                store = view.grid.store;
            
            store.proxy.extraParams.name = rec.get('name');
            store.proxy.extraParams.drv = rec.get('driver');
            store.load();            
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    deleteNode: function (view, nd) {
        nd.remove();        
    },

    deleteTables: function (view, recs) {
        view.store.remove(recs);
    },

    getEditor: function (r) {
        if (!r.isLeaf())
            return Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Text', { allowBlank: false }) });
    },

    updateTlist: function (field, newv) {
        var rec = field.findRecord('name', newv),
            store = this.grid.store;

        store.loaded = false;
        store.proxy.extraParams.name = rec.get('name');
        store.proxy.extraParams.drv = rec.get('driver');
        store.load();
    }

})