Ext.define('QB.view.query.Edit', {
    extend: 'Ext.tab.Panel',    
    requires: ['QB.common.Bargrid', 'QB.SQLQuery', 'QB.model.Param', 'QB.model.Uparam', 'QB.view.query.Add'],
    alias: 'widget.queryedit',
    tabPosition: 'bottom',
    upd: true, 

    initComponent: function () {
        
        var me = this,
            opers = ['Нет', 'Равно', 'Не равно', 'Больше', 'Меньше', 'Определено', 'Не определено', 'С .. по ..', 'Содержит', 'Начинается', 'В списке', 'Не в списке'],
            aggrcombo = new QB.common.Labelcombo({ labels: ['Нет', 'Среднее', 'Количество', 'Группировка', 'Макс.', 'Мин.', 'Сумма'] }),
            ftcombo = new QB.common.Labelcombo({ labels: ['Логический', 'Дата', 'Число', 'Строка'] }); 
        opercombo = new QB.common.Labelcombo({ labels: opers }),
        opercombo1 = new QB.common.Labelcombo({ labels: opers }),
        ordcombo = new QB.common.Labelcombo({ labels: ['Без сортировки', 'По возрастанию', 'По убыванию'] });
        
        me.funcsstore = Ext.create('Ext.data.Store', { model: 'QB.model.Ufunc' });

        me.paramsstore = Ext.create('Ext.data.Store', {
            model: 'QB.model.Param', listeners: { add: me.paramChange, remove: me.paramChange, update: me.paramChange, scope: me }
        });

        me.relsstore = Ext.create('Ext.data.Store', { model: 'QB.model.Rel' });

        me.tablesstore = Ext.create('Ext.data.TreeStore', {
            model: 'QB.model.Table',
            defaultRootId: '',
            defaultRootProperty: 'data',            
            nodeParam: '',
            root: { data: [] },
            proxy: { type: 'ajax', url: '/main/gettables' },
            clearFilter: function () {                
                this.ui.clearFilter();
            },
            filterFn: function (f) {
                this.ui.filter(f.value, ['name', 'rem']);
            },
            listeners: {
                beforeappend: function (nd, child) {
                    child.set('checked', false);
                }
            }
        });                

        me.uparamsstore = Ext.create('Ext.data.Store', { model: 'QB.model.Uparam' });

        me.text = Ext.widget('textarea', {
            region: 'south',
            flex: 2,
            value: 'SELECT\r\nFROM'            
        });

        me.items = [{
            title: 'Основные',
            itemId: 'maintab',
            layout: 'border',
            defaults: { split: true },            
            items: [me.diagram = Ext.widget('panel', {                
                layout: 'fit',
                region: 'center',                
                flex: 6
            }),            
            me.paramgrid = Ext.widget('grid', {  
                itemId: 'paramgrid',
                store: me.paramsstore,
                plugins: [ { ptype: 'cellediting', clicksToEdit: 1 } ],
                columns: [ {
                    text: 'Столбец',
                    dataIndex: 'formula',
                    menuDisabled: true,
                    sortable: false,
                    width: 180,
                    editor: 'textarea'
                },
                {
                    text: 'Псевдоним',
                    dataIndex: 'alias',
                    menuDisabled: true,
                    sortable: false,
                    editor: {}
                },
                {
                    text: 'Таблица',
                    dataIndex: 'tbl',
                    menuDisabled: true,
                    sortable: false,
                    width: 140
                },
                {
                    xtype: 'checkcolumn',
                    text: 'Выход',
                    dataIndex: 'out',
                    menuDisabled: true,
                    sortable: false,
                    width: 60
                },
                {
                    text: 'Тип сортировки',
                    dataIndex: 'ord',
                    menuDisabled: true,
                    sortable: false,
                    width: 120, 
                    editor: ordcombo,
                    renderer: comboRenderer(ordcombo)
                },                
                {
                    text: 'Группировка',
                    dataIndex: 'aggr',
                    menuDisabled: true,
                    sortable: false,
                    width: 120,
                    editor: aggrcombo,
                    renderer: comboRenderer(aggrcombo)
                },
                {
                    text: 'Фильтр',
                    menuDisabled: true,
                    columns: [{
                        text: 'Операция',
                        dataIndex: 'oper',
                        menuDisabled: true,
                        width: 80,
                        editor: opercombo,
                        renderer: comboRenderer(opercombo)
                    },
                    {
                        xtype: 'checkcolumn',
                        dataIndex: 'uor',
                        menuDisabled: true,
                        text: 'Использ.<br>или',
                        width: 60
                    },
                    {
                        xtype: 'checkcolumn',
                        text: 'Пользов.',
                        dataIndex: 'userp',
                        menuDisabled: true,
                        width: 60
                    },
                    {
                        text: 'Описание',
                        dataIndex: 'descr',
                        menuDisabled: true,
                        editor: 'textarea'
                    },
                    {
                        text: 'Значение<br>по умолчанию',
                        dataIndex: 'def',
                        menuDisabled: true,
                        getEditor: me.getEditor,
                        renderer: me.editorRenderer()
                    }]
                },
                {
                    text: 'Фильтр 1',
                    menuDisabled: true,
                    columns: [{
                        text: 'Операция',
                        dataIndex: 'oper1',
                        menuDisabled: true,
                        width: 80,
                        editor: opercombo1,
                        renderer: comboRenderer(opercombo1)
                    },
                    {
                        xtype: 'checkcolumn',
                        dataIndex: 'uor1',
                        menuDisabled: true,
                        text: 'Использ.<br>или',
                        width: 60
                    },
                    {
                        xtype: 'checkcolumn',
                        dataIndex: 'userp1',
                        menuDisabled: true,
                        text: 'Пользов.',
                        width: 60
                    },
                    {
                        text: 'Описание',
                        dataIndex: 'descr1',
                        menuDisabled: true,                        
                        editor: 'textarea'
                    },
                    {
                        text: 'Значение<br>по умолчанию',
                        dataIndex: 'def1',
                        menuDisabled: true,                        
                        getEditor: me.getEditor,
                        renderer: me.editorRenderer()
                    }]
                },
                {
                    text: 'Фильтр 2',
                    menuDisabled: true,
                    columns: [{                         
                        text: 'Значение',
                        dataIndex: 'filter2',
                        menuDisabled: true,                        
                        editor: 'textarea'                    
                    },
                    {
                        xtype: 'checkcolumn',
                        dataIndex: 'uor2',
                        text: 'Использ.<br>или',
                        menuDisabled: true,                        
                        width: 60
                    }]                    
                }],
                selModel: { selType: 'cellmodel' },
                stateful: true,
                stateId: 'paramgrid',
                region: 'south',               
                flex: 4,
                listeners: {
                    beforeedit: function (editor, e) {                        
                        return (e.field == 'formula' || e.record.get('formula') != '*');
                    }
                },
                viewConfig: {
                    plugins: { ptype: 'gridviewdragdrop' }
                }
            }),
            me.uparamgrid = Ext.widget('grid', {
                itemId: 'uparamgrid',
                store: me.uparamsstore,                
                columns: [{
                    text: 'Параметр',
                    dataIndex: 'field',
                    width: 200,
                    editor: {}
                },
                {
                    text: 'Тип',
                    dataIndex: 'ft',                    
                    editor: ftcombo,
                    renderer: me.comboRenderer(ftcombo)
                },
                {
                    text: 'Описание',
                    dataIndex: 'descr',
                    width: 240,
                    editor: 'textarea'
                },
                {
                    text: 'Значение по умолчанию',
                    dataIndex: 'def',
                    width: 200,                    
                    getEditor: me.getUEditor,
                    renderer: me.ueditorRenderer()
                }],
                plugins: [{
                    ptype: 'cellediting',
                    clicksToEdit: 1,
                    listeners: {
                        edit: function (editor, e) { e.record.commit(); }
                    }
                }],
                selModel: { selType: 'cellmodel' },
                stateful: true,
                stateId: 'uparamgrid',
                region: 'south',
                hidden: true,
                flex: 3
            }),
            me.text]
        }];

        me.dockedItems = [{
            xtype: 'toolbar',
            dock: 'top',
            items: [me.userd = Ext.widget('button', {
                iconCls: 'icon-gears',
                tooltip: 'Пользовательский / автоматический',
                enableToggle: true, 
                action: 'userdedined'
            }),
            me.parambtn = Ext.widget('button', {
                iconCls: 'icon-field',
                tooltip: 'Сформировать параметры',
                hidden: true, 
                action: 'pgenerate'
            }),
            '-',
            {
                iconCls: 'icon-tableadd',
                tooltip: 'Добавить таблицу',
                action: 'addtable'
            },
            {
                iconCls: 'icon-chain',
                tooltip: 'Добавить связь',
                action: 'rel'
            },
            {
                iconCls: 'icon-go',
                tooltip: 'Выполнить',
                action: 'exec'
            },
            '-',
            {
                iconCls: 'icon-save',
                tooltip: 'Сохранить',
                action: 'save'
            },            
            {
                text: 'Экспорт',
                iconCls: 'icon-xls',                
                action: 'export'
            },            
            {
                text: 'Отчеты',
                iconCls: 'icon-report',
                menu: me.menu = Ext.widget('menu', {                    
                    items: [{
                        text: 'Изменить',
                        iconCls: 'icon-edit',
                        action: 'reports'                        
                    }]
                })
            },
            '-',
            me.funcbtn = Ext.widget('button', {            
                iconCls: 'icon-func',
                text: 'Функция',                
                action: 'ufunc'
            }),            
            me.ljoin = Ext.widget('checkboxfield', {
                itemId: 'useleftjoin',
                boxLabel: '&nbsp;Использовать LEFT JOIN',                
                margin: '0 5 0 2'
            }),
            '-',
            me.db2mode = Ext.widget('checkboxfield', {
                itemId: 'db2mode',
                boxLabel: '&nbsp;Режим DB2',
                margin: '0 0 0 2',
                hidden: true
            }),
            '->', 'Схема:',
            me.schema = Ext.widget('tbtext')]
        },
        {
            xtype: 'toolbar',
            dock: 'top',
            items: ['Имя:', me.qname = Ext.widget('textfield', { width: 480, allowBlank: false }), 
                    'Группа:', me.group = Ext.widget('textfield', {
                        width: 200,
                        validator: function (v) {
                            if (new RegExp('^\\d+').test(v))
                                return 'Группа не может начинаться с цифры!';
                            else
                                return true;
                        }
                    }),
                    'Подгруппа:', me.subgroup = Ext.widget('textfield', { width: 200 })]
        }];        

        me.SQLQuery = new QB.SQLQuery(me.conn, me);       
        me.addEvents('paramchange');

        me.callParent(arguments);        
    },

    destroy: function () {
        var me = this;
        me.SQLQuery.destroy();
        me.SQLQuery = null;
        me.callParent();
    },

    comboRenderer: function(combo){
        return function(v){
            if (v !== '') {
                var rec = combo.findRecord(combo.valueField, v);
                if (rec) 
                    return rec.get(combo.displayField);
            }
        }
    },

    editorRenderer: function() {
        return function(v, cell, r){
            var m = /^def(\d*)/i.exec(cell.column.dataIndex),
                oper;

            (m) && (oper = r.get('oper' + m[1]));
            if (v !== '') {
                var ft = r.get('ft');                

                switch (ft) {
                    case 0:
                        v = (v == 1) ? 'Да' : 'Нет';
                        break;
                    case 1:
                        (typeof (v) != 'string') && (v = Ext.Date.format(v, 'd.m.Y'));
                        break;
                }                

                return v;
            }            
        }
    },

    getEditor: function (r) {
        var editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Text') }),
            m = /^def(\d*)/i.exec(this.dataIndex),
            oper;
        
        (m) && (oper = r.get('oper' + m[1]));            
        
        if (oper < 9) {
            switch (r.get('ft')) {
                // bool
                case 0:
                    editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('QB.common.Labelcombo', { labels: ['Нет', 'Да'] }) });
                    break;
                // datetime
                case 1:
                    editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Date', { format: 'd.m.Y', value: new Date() }) });
                    break;
                // numeric
                case 2:
                    editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Number', { hideTrigger: true }) });
                    break;                
            }
        }

        return editor;
    },

    getUEditor: function (r) {
        var editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Text') });

        switch (r.get('ft')) {
            // bool
            case 0:
                editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('QB.common.Labelcombo', { labels: ['Нет', 'Да'] }) });
                break;
            // datetime
            case 1:
                editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Date', { format: 'd.m.Y', value: new Date() }) });
                break;
                // numeric
            case 2:
                editor = Ext.create('Ext.grid.CellEditor', { field: Ext.create('Ext.form.field.Number', { hideTrigger: true }) });
                break;
        }
        return editor;
    },

    paramChange: function (store, rec, op, mods) {
        var me = this;
        if (op == 'edit') {
            var conds = ['=', '!', '<', '>'],
                opers = ['between', 'in', 'is', 'like'],
                filters = ['aggr', 'formula', 'oper', 'oper1', 'filter2'];
                        
            mods.forEach(function (m) {                

                if (filters.indexOf(m) != -1) {
                    var v = rec.get(m);

                    if (v) {
                        switch (m) {
                            case 'aggr':
                                if (v != 3) {
                                    var ax = rec.get('ax');
                                    // find available index
                                    (!ax) && (ax = me.SQLQuery.getAvailableIx() - 1);

                                    alias = 'Expr' + ++ax;
                                    rec.data['alias'] = alias;
                                }
                                break;
                            case 'formula':
                                var alias = rec.get('alias');

                                if (!alias) {
                                    var field = rec.get('field'),
                                        formula = rec.get('formula');

                                    if (field != formula) {
                                        var ax = rec.get('ax');

                                        if (!new RegExp('\\b' + field + '\\b', 'i').exec(formula)) {
                                            me.SQLQuery.deleteParam(field, ax);
                                            ax = me.SQLQuery.addParam(formula);

                                            var t = me.SQLQuery.getTable(rec.get('table'));
                                            if (t) {
                                                var r = t.wnd.store.findRecord('name', field);
                                                if (r) {
                                                    r.set('out', false);
                                                    r.commit();
                                                }
                                            }

                                            rec.data['field'] = '';
                                        }
                                        else {
                                            // find available index
                                            (!ax) && (ax = me.SQLQuery.getAvailableIx() - 1);
                                        }
                                        alias = 'Expr' + ++ax;
                                    }
                                    rec.data['alias'] = alias;
                                }
                                break;
                            
                            case 'oper':                                
                                // between
                                (v == 7) && (rec.data['oper1'] = v);
                                break;

                            case 'oper1':
                                // between
                                (v == 7) && (rec.data['oper'] = v);
                                break;

                            case 'filter2':
                                var ft = rec.get('ft'),
                                    needEqual = true;

                                // conditions
                                conds.concat(opers).forEach(function (c) {
                                    if (v.indexOf(c) == 0) {
                                        needEqual = false;
                                        return true;
                                    }
                                })

                                if (needEqual) {
                                    if (ft == 1 || ft == 3) {
                                        v = v.trimLeft();
                                        (v[0] != '\'') && (v = '\'' + v);
                                        (v[v.length - 1] != '\'') && (v = v + '\'');
                                    }
                                    rec.data[m] = '= ' + v;
                                }
                                else {
                                    var needQuotes = true;
                                    // operations
                                    opers.forEach(function (o) {
                                        if (v.indexOf(o) == 0) {
                                            needQuotes = false;
                                            return true;
                                        }
                                    })

                                    if (needQuotes) {
                                        if (ft == 1 || ft == 3) {
                                            var eq = v[0];

                                            v = v.substr(1).trimLeft();
                                            (v[0] != '\'') && (v = '\'' + v);
                                            (v[v.length - 1] != '\'') && (v = v + '\'');

                                            rec.data[m] = eq + ' ' + v;
                                        }
                                    }
                                }

                                break;
                        }
                    }                        
                }
            })
            rec.commit(false);
        }
        me.fireEvent('paramchange', rec);
    },

    ueditorRenderer: function() {
        return function(v, cell, r){            
            if (v !== '') {
                var ft = r.get('ft');

                switch (ft) {
                    case 0:
                        v = (v == 1) ? 'Да' : 'Нет';
                        break;
                    case 1:
                        (typeof (v) != 'string') && (v = Ext.Date.format(v, 'd.m.Y'));
                        break;
                }                

                return v;
            }
        }
    }
})