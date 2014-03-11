Ext.define('QB.view.query.Rlist', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Bargrid', 'QB.common.Updwnd'],
    alias: 'widget.queryrlist',    
    btnSave: false,
    title: 'Связи',
    height: 480,
    width: 520,

    initComponent: function () {
        var me = this,
            tables = Ext.Array.map(me.query.tables, function (t) {
                return { text: t.name, value: t.name, od: t.table.od, schema: t.table.schema };
            }),
            tstore = Ext.create('Ext.data.Store', { fields: ['text', 'value', 'od', 'schema'], data: tables });       

        var dsttcombo = new Ext.form.field.ComboBox({ editable: false, store: tstore, valueField: 'value' }),
            srctcombo = new Ext.form.field.ComboBox({ editable: false, store: tstore, valueField: 'value' });

        me.dstfcombo = new Ext.form.field.ComboBox({ editable: false, queryMode: 'local', store: Ext.create('Ext.data.Store', { fields: ['text', 'value'] }), valueField: 'value' }),
        me.srcfcombo = new Ext.form.field.ComboBox({ editable: false, queryMode: 'local', store: Ext.create('Ext.data.Store', { fields: ['text', 'value'] }), valueField: 'value' });

        me.items = [{ xtype: 'label', text: 'Внимание! Корректно связать можно только поля одного типа.', padding: '0 2 1', style: { color: '#DD4B39' } },
        me.grid = Ext.widget('bargrid', {
            enableEdit: false,
            bbarConfig: { enable: false },
            tbarConfig: { enableSearch: false },
            columns: [ { xtype: 'rownumberer' },
            {
                text: 'Источник',
                columns: [{
                    text: 'Таблица',
                    dataIndex: 'tab',
                    width: 140,
                    editor: srctcombo,
                    renderer: comboRenderer(srctcombo)
                },
                {
                    text: 'Поле',
                    dataIndex: 'field',
                    editor: me.srcfcombo,
                    renderer: me.editorRenderer(me.srcfcombo)
                }],
                align: 'center'                
            },
            {
                text: 'Назначение',
                columns: [{
                    text: 'Таблица',
                    dataIndex: 'reftab',
                    width: 140,
                    editor: dsttcombo,
                    renderer: comboRenderer(dsttcombo)
                },
                {
                    text: 'Поле',
                    dataIndex: 'reffield',
                    editor: me.dstfcombo,
                    renderer: me.editorRenderer(me.dstfcombo)
                }],
                align: 'center'                
            }],
            listeners: { additem: me.addRel, removeitem: me.deleteRel },
            plugins: [{
                pluginId: 'celleditor',
                ptype: 'cellediting',
                clicksToEdit: 1,
                listeners: {
                    beforeedit: function(editor, e){
                        var ix = e.colIdx, need, v;

                        if (ix == 2 || ix == 4){
                            switch (ix){
                                case 2:
                                    need = 'needfield';
                                    v = e.record.get('tab');
                                    break;
                                case 4:
                                    need = 'needreffield';
                                    v = e.record.get('reftab');
                                    break;
                            }

                            if (e.record.get(need)) {
                                var ed = e.column.getEditor(),                                
                                    t = e.grid.up('window').query.getTable(v);

                                if (t) {
                                    var store = t.wnd.store, fields = [];

                                    store.each(function (r) {
                                        v = r.get('name');
                                        (v != '*' && r.get('nt') != 6) && fields.push({ text: v, value: v });                                        
                                    })
                                    ed.store.loadData(fields);                                    
                                }
                                e.record.set(need, 0);
                            }
                        }                       
                        
                    },
                    edit: function (editor, e) {
                        var ix = e.colIdx, rec = e.record, r;

                        if (ix == 1 || ix == 3) {
                            var ed = e.grid.columns[ix + 1].getEditor();
                            ed.store.removeAll();

                            switch (ix) {
                                case 1:
                                    (e.value != e.ordinalValue) && (rec.set('needfield', 1));

                                    ed = e.column.getEditor();
                                    r = ed.store.findRecord('value', e.value);

                                    if (r) {
                                        rec.set('od', r.get('od'));
                                        rec.set('schema', r.get('schema'));
                                    }

                                    break;
                                case 3:
                                    (e.value != e.ordinalValue) && (rec.set('needreffield', 1));

                                    ed = e.column.getEditor();
                                    r = ed.store.findRecord('value', e.value);

                                    if (r) {
                                        rec.set('refod', r.get('od'));
                                        rec.set('refschema', r.get('schema'));
                                    }
                                    break;
                            }
                        }

                        rec.commit();
                    }
                }
            }],
            store: me.store,
            viewConfig: {
                getRowClass: function (row) {                    
                    if (row.get('err'))
                        return 'x-grid-row-red';                    
                }
            }
        })];

        me.buttons = [{ text: 'OK', iconCls: 'icon-go', action: 'add' }];
        me.callParent(arguments);
    },

    addRel: function (view) {
        var me = this;
        me.store.add(new QB.model.Rel({ needfield: 1, needreffield: 1 }));
        view.getPlugin('celleditor').startEdit(me.store.getCount() - 1, 0);
    },

    deleteRel: function (view, rec, ix) {        
        Ext.Msg.confirm('Внимание', 'Удалить выбранную связь?', function (btn) {
            (btn == 'yes') && view.store.removeAt(ix); 
        })
    },

    editorRenderer: function (combo) {
        return function (v) {
            if (v) {
                var rec = combo.findRecord(combo.valueField, v);
                if (rec)
                    return rec.get(combo.displayField);
                else
                    return v;
            }
        }
    }
})