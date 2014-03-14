Ext.define('QB.view.table.Edit', {
    extend: 'Ext.window.Window',
    requires: ['Ext.ux.grid.FiltersFeature', 'QB.common.Imagecolumn', 'QB.SQLTable', 'QB.store.Lstore'],
    alias: 'widget.tableedit',        
    collapsible: true,
    constrainHeader: true,
    layout: { type: 'vbox', align: 'stretch' },
    readOnly: false,
    height: 160,
    width: 250,    

    initComponent: function () {
        var me = this,
            filters = {
                ftype: 'filters',
                menuFilterText: 'Фильтр',
                encode: true,
                local: true
            };

        me.store = Ext.create('QB.store.Lstore', {
            fields: ['out', 'name', 'rem', 'ft', 'nt', 'joined'],
            sorters: ['rem']
        });

        me.grid = Ext.widget('grid', {            
            store: me.store,
            columns: [{ xtype: 'checkcolumn', dataIndex: 'out', disabled: me.readOnly, sortable: false, width: 24 },
                      { dataIndex: 'rem', filterable: true, flex: 1, renderer: me.fieldRenderer },
                      { dataIndex: 'name', filterable: true, flex: 1 },
                      { xtype: 'imagecolumn', dataIndex: 'joined', sortable: false, width: 20, align: 'left', img: '/content/chain.png' }],                        
            enableColumnHide: false,
            features: [filters],
            flex: 1,
            viewConfig: {
                copy: true,
                getRowClass: function (r) {
                    switch (r.get('nt')){
                        case 5:
                            return 'rowpk';
                            break;
                        case 6:
                            return 'rowfk';
                            break;
                    }                    
                }  
            }            
        });
        
        me.items = [{
            xtype: 'label',
            cls: 'x-header-text-container remark',            
            padding: '0 2 1',
            text: me.remark,
            hidden: !(me.remark)
        }, me.grid ];

        me.tools = [{
            type: 'refresh',
            tooltip: 'Удалить фильтр',
            action: 'clearfilter'
        }];

        me.SQLTable = new QB.SQLTable(me.od, me.table, me.schema, me.conn, me.checks, me);        
        me.callParent(arguments);

        me.grid.getView().on('render', function (view) {
            view.tip = Ext.create('Ext.tip.ToolTip', {
                target: view.el,
                delegate: view.itemSelector,
                renderTo: Ext.getBody(),
                trackMouse: true,
                listeners: {
                    beforeshow: function updateTipBody(tip) {
                        var rec = view.getRecord(tip.triggerElement),
                            data = rec.get('rem');

                        if (data) {
                            tip.update(data);
                        }
                        else
                            return false;
                    }
                }
            });
        });
    },    

    fieldRenderer: function (v, m, r) {
        (r.get('name') == '*') && (v = ' (Все столбцы)');
        return v;
    }
})