Ext.define('QB.view.query.Fnedit', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Updwnd'],
    alias: 'widget.queryfnedit',        
    title: 'Функция',
    height: 520,
    width: 520,

    initComponent: function () {
        var me = this,
            aggrstore = Ext.create('Ext.data.Store', {
                fields: ['text', 'value'],
                data: [{ text: 'Нет', value: 0 }, { text: 'Среднее', value: 1 }, { text: 'Количество', value: 2 }, { text: 'Макс.', value: 4 }, { text: 'Мин.', value: 5 }, { text: 'Сумма', value: 6 }]
            });

        me.store = Ext.create('Ext.data.Store', { model: 'QB.model.Alias' });

        me.form = Ext.widget('form',
        {
            defaults: { anchor: '100%', labelWidth: 130, margin: '5' },
            items: [{
                xtype: 'fieldcontainer',
                fieldLabel: 'Из справочника',
                defaults: { xtype: 'radiofield', name: 'tp' },
                layout: 'hbox',
                items: [{
                    boxLabel: 'Да',
                    inputValue: 1,
                    checked: 1,
                    width: 186,
                    listeners: { change: me.toggleTp, scope: me }
                },
                {
                    boxLabel: 'Нет',
                    inputValue: null                    
                }]
            },
            me.combo = Ext.widget('combo', {
                name: 'fnid',
                store: Ext.create('Ext.data.JsonStore', {
                    fields: ['id', 'name', 'body', 'args'],
                    proxy: {
                        type: 'ajax',
                        url: 'admin/getfuncs',
                        extraParams: { body: 1 },
                        reader: { type: 'json', root: 'data' }
                    },
                    pageSize: 10
                }),
                tpl: '<tpl for="."><div class="x-boundlist-item">{name} (параметров - {args})</div></tpl>',
                fieldLabel: 'Справочник',                
                typeAhead: true,
                minChars: 3,
                labelWidth: 130,
                displayField: 'name',
                valueField: 'id',                
                pageSize: 10,
                listConfig: {
                    loadingText: 'Поиск...',
                    emptyText: 'Записи не найдены.'
                },
                listeners: { change: me.fnChange, scope: me },
                allowBlank: false
            }),
            me.text = Ext.widget('textarea', { name: 'body', fieldLabel: 'Тело', labelWidth: 130, height: 80, hidden: true }),
            me.args = Ext.widget('textfield', { name: 'args', hidden: true }),
            {
                xtype: 'fieldset',
                title: 'Выход',                
                margin: '12 5 5 5',
                items: [{
                    xtype: 'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype: 'checkboxfield',
                        name: 'out',
                        fieldLabel: 'Включить',
                        checked: true,
                        labelWidth: 120,
                        width: 240,
                        margin: '0 26 5 0',
                        listeners: { change: me.toggleOn }
                    },
                    {
                        xtype: 'textfield',
                        name: 'alias',
                        fieldLabel: 'Псевдоним',
                        labelWidth: 80,
                        flex: 1
                    }]
                },
                {
                    xtype: 'combo',
                    name: 'outaggr',
                    store: aggrstore,
                    fieldLabel: 'Агрегация',
                    editable: false,
                    valueField: 'value',
                    value: 0,
                    allowBlank: false,
                    labelWidth: 120,
                    width: 240
                }]
            },
            {
                xtype: 'fieldset',
                title: 'Фильтр',
                items: [{
                    xtype: 'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype: 'checkboxfield',
                        name: 'filter',
                        fieldLabel: 'Включить',                        
                        labelWidth: 120,
                        width: 240,
                        margin: '0 26 5 0',
                        listeners: { change: me.toggleOn }
                    },
                    {
                        xtype: 'checkboxfield',
                        name: 'uor',
                        fieldLabel: 'Использовать или',
                        disabled: true,
                        labelWidth: 80,
                        flex: 1                        
                    }]
                },
                {
                    xtype: 'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype: 'labelcombo',
                        name: 'oper',
                        fieldLabel: 'Операция',
                        labels: ['Равно', 'Не равно', 'Больше', 'Меньше', 'Определено', 'Не определено'],
                        offset: 1,
                        value: 1,
                        allowBlank: false,
                        labelWidth: 120,
                        width: 240,
                        disabled: true,
                        margin: '0 26 5 0'
                    },
                    {
                        xtype: 'textfield',
                        name: 'def',
                        fieldLabel: 'Значение',
                        disabled: true,
                        labelWidth: 80,
                        flex: 1
                    }]
                },
                {
                    xtype: 'combo',
                    name: 'filteraggr',
                    store: aggrstore,
                    fieldLabel: 'Агрегация',                    
                    editable: false,
                    disabled: true,
                    valueField: 'value',
                    value: 'Нет',
                    allowBlank: false,
                    labelWidth: 120,
                    width: 240
                }]
            },
            {
                xtype: 'fieldset',
                title: 'Сортировка',                
                items: [{
                    xtype: 'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype: 'checkboxfield',
                        name: 'ord',
                        fieldLabel: 'Включить',
                        labelWidth: 120,
                        width: 240,
                        listeners: { change: me.toggleOn },
                        margin: '0 26 5 0'
                    },
                    {
                        xtype: 'labelcombo',
                        name: 'dir',
                        fieldLabel: 'Направление',
                        labels: ['По возрастанию', 'По убыванию'],
                        disabled: true,
                        labelWidth: 80,
                        flex: 1,
                        offset: 1,
                        value: 1,
                        allowBlank: false
                    }]
                },
                {
                    xtype: 'combo',
                    name: 'ordaggr',
                    store: aggrstore,
                    fieldLabel: 'Агрегация',
                    disabled: true,
                    editable: false,
                    valueField: 'value',
                    value: 'Нет',
                    allowBlank: false,
                    labelWidth: 120,
                    width: 240
                }]
            }]
        });

        me.items = [me.tabs = Ext.widget('tabpanel', {
            defaults: { layout: 'fit' },
            items: [{
                title: 'Основные',
                items: [me.form]
            },
            {
                title: 'Параметры',
                items: [{
                    xtype: 'bargrid',
                    bbarConfig: { enable: false },
                    tbarConfig: { enable: false },
                    columns: [ { text: 'Описание', dataIndex: 'descr', flex: 1 },
                               { text: 'Тип', dataIndex: 'ft', renderer: me.ftRenderer() },
                               {
                                   text: 'Значение',
                                   dataIndex: 'def',
                                   getEditor: me.getEditor,
                                   renderer: me.editorRenderer()
                               }],
                    plugins: [{ 
                        ptype: 'cellediting', 
                        clicksToEdit: 1, 
                        listeners: { edit: function (editor, e) { e.record.commit(); } }
                    }],
                    store: me.store
                }]
            }]
        })]

        me.callParent(arguments);
    },

    editorRenderer: function() {
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
    },

    ftRenderer: function(){        
        return function (v) {
            var labels = ['Логический', 'Дата', 'Число', 'Строка'];
            return labels[v];            
        }
    },

    fnChange: function (field, newv) {
        var me = this;

        me.store.removeAll();

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getfunc',
            params: { id: newv },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                                        
                    me.fn = obj.func;
                    me.fn.params = me.fn.params || [];

                    var args = me.args.getValue().split(';');                        
                    me.fn.params.forEach(function (p, ix) {
                        p.def = args[ix];
                        me.store.add(new QB.model.Fparam(p));
                    })                    
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },

    getEditor: function (r) {
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

    toggleOn: function (field, newv) {
        var fset = field.up('fieldset');

        fset.query('fieldcontainer >').forEach(function (f) {
            (f.name != field.name) && f.setDisabled(!newv);            
        })

        fset.child('combo').setDisabled(!newv);
    },

    toggleTp: function (field, newv) {
        var me = this;
        
        me.combo.setVisible(newv);
        me.combo.allowBlank = !newv;        
        me.combo.validate();

        me.text.setVisible(!newv);
        me.text.allowBlank = newv;
        me.text.validate();

        me.tabs.items.getAt(1).tab.setVisible(newv);
    }
})