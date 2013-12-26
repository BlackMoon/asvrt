Ext.define('QB.view.section.Edit', {
    extend: 'QB.Common.Updwnd',
    requires: ['QB.Common.Bargrid', 'QB.Common.Bartree', 'QB.Common.Updwnd' ],
    layout: { type: 'vbox', align: 'stretch' },
    alias: 'widget.sectionedit',
    btns: ['addall', 'add', 'remove', 'removeall'],
    btnsText: { addall: 'Добавить все', add: 'Добавить', remove: 'Удалить', removeall: 'Удалить все' },
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
                rootVisible: false,
                tbarConfig: { enableSearch: false },
                columns: [{ xtype: 'treecolumn', dataIndex: 'name', flex: 1, editor: { allowBlank: false } }],
                listeners: {
                    additem: me.addNode, removeitem: me.deleteNode, scope: me,
                    afterrender: function (view) {
                        var root = view.getRootNode();
                        view.getSelectionModel().select(root);                        
                    }
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
                        nodedragover: function (targetNode, position) {
                            console.log(arguments);
                            return !targetNode.isRoot();
                        },
                        drop: function (node, data) {
                            data.records.forEach(function (rec) {
                                rec.set('leaf', true);
                            })
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
                    selectionchange: function (selmodel, selected) {
                        var btnAdd = me.down('button[itemId=add]'),
                            sel = me.tree.selected[0];              // root always selected
                            
                        this.selected = selected;
                        btnAdd.setDisabled(selected.length === 0 && !sel.isRoot() && !sel);                        
                    }
                },
                viewConfig: {
                    plugins: {
                        ptype: 'gridviewdragdrop',
                        ddGroup: 'ddGroup',
                        dragText: 'Добавить'
                    }
                },
                flex: 3
            })],
            flex: 1
        }];
        
        me.callParent(arguments);
        me.addEvents('addnode', 'removenode');
    },

    addNode: function(view){
        var me = this, nd,
            pnd = view.selected[0];

        pnd.expand();        

        nd = view.selected[0].appendChild(new QB.model.Table({ name: 'Раздел' }));
        view.getSelectionModel().select(nd);
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

    updateTlist: function (field, newv) {
        var rec = field.findRecord('name', newv),
            store = this.grid.store;

        store.loaded = false;
        store.proxy.extraParams.name = rec.get('name');
        store.proxy.extraParams.drv = rec.get('driver');
        store.load();
    }

})