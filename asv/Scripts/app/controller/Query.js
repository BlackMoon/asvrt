String.prototype.nthIndexOf = function (needle, n) {
    for (var i = 0; i < this.length; ++i) {
        if (this[i] == needle) {
            n--;
            if (n == 0)
                return i;
        }
    }
    return -1;
}

Ext.define('QB.controller.Query', {
    extend: 'QB.controller.Base',
    ix: 0,    
    curSQL: null,
    models: ['Rel', 'Ufunc'],
    stores: [ 'Qdbs', 'Queries', 'Templates'],
    views: ['query.Add', 'query.Edit', 'query.Fnedit', 'query.Fnlist', 'query.Form', 'query.List', 'query.Rlist', 'report.List', 'table.Edit'],

    init: function () {
        var me = this;        

        me.control({
            '[action=addtable]': {
                click: me.table
            },
            '[action=exec]': {
                click: function () { me.exec(me.execParam); }
            },
            '[action=query]': {
                click: me.createQuery
            },
            'menuitem[action=reports]': {
                click: me.showReports
            },
            'queryadd': {
               close: me.onTablistClose
            },
            'queryadd combobox': {
                change: me.showTables
            },
            'queryadd button[action=add]': {
                click: me.onTableAdd
            },
            'queryadd button[action=refresh]': {
                click: me.refreshTables
            },            
            'queryedit': {
                afterrender: me.onPanelRender,
                paramchange: me.onParamChange
            },
            'queryedit [action=save]': {
                click: me.updateQuery
            },
            'queryedit button[action=export]': {
                click: function () { me.exec(me.exportQuery); }
            },
            'queryedit button[action=ufunc]': {
                click: me.showUfuncs
            },
            'queryedit button[action=pgenerate]': {
                click: me.generateParams
            },
            'queryedit button[action=rel]': {
                click: me.showRelations
            },
            'queryedit button[action=userdedined]': {
                toggle: me.onUDefToggle
            },
            'queryedit checkboxfield[itemId=db2mode]': {
                change: me.onModeChange
            },
            'queryedit checkboxfield[itemId=useleftjoin]': {
                change: me.onLJoinChange
            },            
            'queryedit grid[itemId=paramgrid] gridcolumn[dataIndex=out]': {
                checkchange: me.onCheckChange
            },
            'queryfnedit button[action=save]': {
                click: me.updateUfunc
            },
            'queryfnlist button[action=add]': {
                click: me.addUfuncs
            },
            'queryform button[action=execparam]': {
                click: me.getUserParams
            },
            'querylist': {
                additem: me.createQuery,
                edititem: me.editQuery,
                removeitem: me.deleteQuery
            },
            'queryrlist button[action=add]': {
                click: me.addRelations
            },
            'reportlist button[action=add]': {
                click: me.addReports
            },
            'tableedit': {
                close: me.onTableClose                
            },
            'tableedit tool[action=clearfilter]': {
                click: me.clearFilters
            },
            'tableedit grid gridcolumn[dataIndex=out]': {
                checkchange: me.addField
            },
            'toolbar [action=queries]': {
                click: me.showQueries
            },
            'viewport [region=center]': {
                remove: function (p) { (p.items.length == 0) && (me.curSQL = null); },
                tabchange: me.onTabChange
            }
        });
    },

    onCheckChange: function (col, rowIx, checked) {
        var view = col.up('grid').view,
            rowNode = view.getNode(rowIx),
            rec = view.getRecord(rowNode),            
            field = rec.get('field'),
            table = rec.get('tbl');                

        this.checkField(field, table, checked);        
    },

    onLaunch: function () {
        var me = this;
        
        me.explorer = me.application.viewport.down('explorer');
        me.callParent(arguments);
    },

    onLJoinChange: function (field, newv) {
        var query = this.curSQL;

        if (query.loaded) {
            query.useleftjoin = newv ? 1 : 0;
            query.updateSQL();
        }
    },

    onModeChange: function (field, newv) {
        var query = this.curSQL;

        query.db2mode = newv ? 1 : 0;        
    },

    onPanelRender: function (panel) {                
        var me = this;        
        panel.diagram.el.on('contextmenu', function (e) {
            e.preventDefault();
            
            var contextMenu = panel.contextMenu || (panel.contextMenu =
            Ext.widget({
                xtype: 'menu',                
                items: [{
                    text: 'Добавить таблицу',
                    iconCls: 'icon-tableadd',                    
                    action: 'addtable'
                },
                {
                    text: 'Выполнить',
                    iconCls: 'icon-go',                    
                    action: 'exec'
                },
                '-',
                {
                    text: 'Сохранить',
                    iconCls: 'icon-save',                    
                    handler: me.updateQuery,
                    scope: me
                }]
            }));

            contextMenu.showAt(e.getXY());
        });
    },
    
    onParamChange: function () {
        this.curSQL.updateSQL();        
    },

    onTabChange: function (tpanel, newt) {        
        this.curSQL = newt.sqltab ? newt.down('panel').SQLQuery : null;
    },

    onTableAdd: function (btn) {
        var me = this, wnd = btn.up('window'),            
            panel = me.curSQL.panel;

        me.onTablistClose(wnd);

        var name, tables = [];
        wnd.tree.getChecked().forEach(function (nd) {
            if (nd.isLeaf()) {
                name = nd.get('name');
                if (tables.indexOf(name) == -1) {
                    me.addTable(panel, name, nd.get('rem'), nd.get('od'), nd.get('schema'));
                    tables.push(name);
                }
            }
        });

        wnd.close();
    },

    onTableClose: function (w) {
        var me = this, query = me.curSQL,
            store = query.panel.paramsstore,
            t = query.getTable(w.title);

        if (t) {            
           
            query.deleteTable(w.title);
             
            var field, removed = [];
            store.each(function (r) {
                if (r.get('tbl') == w.title) {
                    field = r.get('field');
                    query.deleteParam(field ? field : r.get('formula'), r.get('ax'));
                    removed.push(r);
                }
            });

            (removed.length) ? store.remove(removed) : query.updateSQL();
        }
    },

    onTablistClose: function (w) {
        var query = this.curSQL;

        query.panel.setActiveTab(0);

        if (!query.conn) {
            var combo = w.combo,
                rec = combo.store.findRecord('name', combo.getValue());

            if (rec) {
                query.conn = rec.data;
                query.updateLabel();
            }
        }
    },

    onUDefToggle: function (btn, pressed) {
        var query = this.curSQL,
            panel = query.panel;

        query.userdefined = pressed ? 1 : 0;
        panel.diagram.setVisible(!pressed);
        panel.parambtn.setVisible(!panel.readOnly && pressed);

        panel.paramgrid.setVisible(!pressed);
        panel.uparamgrid.setVisible(pressed);
    },

    addField: function (column, rowIx, checked) {
        var wnd = column.up('window'),
            table = wnd.SQLTable,
            view = wnd.grid.view,
            rowNode = view.getNode(rowIx),
            rec = view.getRecord(rowNode),
            name = rec.get('name'),
            nt = rec.get('nt'),
            rem = rec.get('rem'),
            query = this.curSQL,
            store = query.panel.paramsstore,            
            schema = table.schema;
            tbl = table.name;
        
        rec.commit();

        if (nt != 6) {

            if (!query.userdefined) {

                (table.ix) && (tbl += '_' + table.ix);

                var ix = store.findBy(function (r) {
                    return (r.get('tbl') == tbl && r.get('field') == name);
                });

                if (checked) {
                    // exist
                    if (ix != -1) {
                        rec = store.getAt(ix);
                        rec.set('out', true);
                    }
                        // new param
                    else {
                        var ax = query.addParam(name),
                            alias = '';

                        if (!ax) {
                            var words = rem.split(' ');
                            (words.length > 0) && (alias = words[0]);
                        }
                        else
                            alias = 'Expr' + ax;

                        rec = new QB.model.Param({ field: name, formula: name, alias: alias, ax: ax, ft: rec.get('ft'), schema: schema, tbl: tbl, tabix: table.ix });
                        store.add(rec);
                    }
                }
                else {
                    if (ix != -1) {
                        rec = store.getAt(ix)
                        query.deleteParam(name, rec.get('ax'));
                        store.remove(rec);
                    }
                }
            }
        }
        else {
            if (checked) {
                var fk = Ext.Array.findBy(table.fkeys, function (k) {
                    return (k.name == name);
                }),
                t = query.getTable(fk.reftable, 1);

                if (!t) {
                    var panel = query.panel, rem, f = (query.conn.drv == 0) ? 'od' : 'name',                                                
                        nd = panel.tablesstore.getRootNode().findChild(f, fk.reftable, true);
                    
                    (nd) && (rem = nd.get('rem'));                    

                    this.addTable(panel, fk.reftable, rem, fk.refod || fk.reftable, fk.refschema);
                }
            }
        }
    },

    addRelations: function (btn) {
        var me = this, err, failed = 0, rels = [],
            query = me.curSQL, wnd = btn.up('window');        

        query.panel.relsstore.each(function (r, ix) {
            err = r.validate();
            if (err.length > 0) {
                r.set('err', 1);
                failed = 1;
            }
            else {
                r.set('err', 0);
                rels.push({ tab: r.get('tab'), od: r.get('od'), schema: r.get('schema'), field: r.get('field'), reftab: r.get('reftab'), refod: r.get('refod'), refschema: r.get('refschema'), reffield: r.get('reffield') });                
            }
        })

        if (!failed) {
            query.relations = rels;

            me.onParamChange();
            query.updateRelLabels();

            wnd.close();
        }
        else           
            Ext.MessageBox.show({ title: 'Внимание', msg: 'Ошибка заполнения', buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });      
    },

    addReports: function (btn) {
        var me = this, item,
            menu = me.curSQL.panel.menu,
            len = menu.items.getCount(),
            wnd = btn.up('window');
        
        (len == 1) && menu.add('-');        
        while (len > 2) {
            item = menu.items.getAt(--len);
            menu.remove(item);
        }     

        wnd.grid.getSelectionModel().getSelection().forEach(function (r) {
            menu.add({
                repId: r.get('id'), text: r.get('name'), iconCls: 'icon-xls', handler: function (item) { me.exec(me.print, item); }, scope: me
            });
        });

        wnd.close();        
    },    

    addTable: function (panel, name, remark, od, schema, collapsed, checks) {
        var me = this, ix = 0, d = [],
            query = me.curSQL, rem = '',
            t = query.getTable(name), title = name;        

        // duplicates
        if (t) {
            ix = t.availableIdx();
            t.duplicates.push(ix);
            title = name + '_' + ix;
        }
            // maybe parent
        else
            d = query.getDuplicates(name);
        
        var rels = [];
        query.relations.forEach(function (r) {
            if (r.tab == name)
                rels.push({ cols: [r.field] });

            if (r.reftab == name)
                rels.push({ cols: [r.reffield] });
        })

        var view = Ext.widget('tableedit', { conn: query.conn, od: od, schema: schema, table: name, title: title, remark: remark, checks: checks, readOnly: panel.readOnly, closable: !panel.readOnly });
        view.SQLTable.rels = rels;

        panel.diagram.add(view);
        query.calculateAvailableXY();        

        view.show(null, me.editTable);        
        view.setPosition(query.avX, query.avY);
        collapsed && view.collapse();
       
        view.SQLTable.ix = ix;
        view.SQLTable.duplicates = d;
        view.SQLTable.parent = t;
        title && query.addTable(title, view.SQLTable);
    },
       
    addUfuncs: function (btn) {
        var wnd = btn.up('window');
        wnd.close();
        this.onParamChange();
    },

    checkField: function (field, table, checked) {
        var t = this.curSQL.getTable(table);
        if (t) {
            var r = t.wnd.store.findRecord('name', field);
            if (r) {
                r.set('out', checked);
                r.commit();
            }
        }
    },

    clearFilters: function (tool) {
        var grid = tool.toolOwner.grid;
        grid.filters.clearFilters();
    },

    createQuery: function () {
        var me = this, conn, nd = me.explorer.getRootNode();

        if (nd.childNodes.length == 1) {
            nd = nd.firstChild;
            conn = { name: nd.get('name'), drv: nd.get('drv'), schema: nd.get('schema') };
        }
        else {
            if (nd = me.explorer.selNode) {
                while (nd.get('nt') != 0) {
                    nd = nd.parentNode;
                }
                conn = { name: nd.get('name'), drv: nd.get('drv'), schema: nd.get('schema') };
            }
        }

        var title = 'Запрос ' + ++me.ix,
            panel = Ext.widget('queryedit', { conn: conn, upd: false }),
            tab = me.centerRegion.add({ title: title, sqltab: 1, layout: 'fit', items: [panel] });

        panel.qname.setValue(title);
        tab.show();
        me.curSQL = panel.SQLQuery;

        me.refreshQdbs();

        var wnd = Ext.widget('queryadd', { store: panel.tablesstore });        
        (conn) && wnd.combo.hide();
        wnd.doSetValue(conn);        
    },

    deleteQuery: function (view, rec, ix) {        
        var me = this, name = rec.get('name');

        Ext.Msg.confirm('Внимание', 'Удалить запрос <b>' + name + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/main/deletequery',
                    method: 'get',
                    params: { id: rec.get('id') },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            var tab = me.centerRegion.child('[sqltab=1][title=' + name + ']');
                            (tab) && tab.close();
                            view.store.removeAt(ix);
                        }
                        else
                            showStatus(obj.message);
                    }                    
                });
            }
        })
    },
    
    editQuery: function (view, rec) {        
        var me = this, panel,                        
            title = rec.get('name'),
            tab = me.centerRegion.child('[sqltab=1][title=' + title + ']');            
        
        if (!tab) {
            var conn = { name: rec.get('conn'), drv: rec.get('drv'), schema: rec.get('schema') },
                grp = rec.get('grp'),
                panel = Ext.widget('queryedit', { conn: conn, readOnly: rec.get('readonly') }),
                pstore = panel.paramsstore;                

            tab = me.centerRegion.add({ title: title, sqltab: 1, layout: 'fit', items: [panel] });
            tab.show();

            me.curSQL = panel.SQLQuery;
            me.curSQL.loaded = false;
            panel.el.mask('Загрузка', 'x-mask-loading');

            Ext.Ajax.request({
                method: 'get',
                url: '/main/getquery',
                params: { id: rec.get('id') },
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success && obj.query) {
                        var params = obj.query.params || [],
                            reports = obj.query.reports || [];                           

                        me.curSQL.id = obj.query.id;
                        me.curSQL.sql = obj.query.sql;
                        me.curSQL.db2mode = obj.query.db2mode;
                        me.curSQL.useleftjoin = obj.query.useleftjoin;
                        me.curSQL.userdefined = obj.query.userdefined || 0;                        

                        // relations for tables
                        obj.query.relations.forEach(function (r) {
                            me.curSQL.relations.push(r);                            
                        })

                        obj.query.tables.forEach(function (t) {                            
                            me.addTable(panel, t.name, t.rem, t.od, t.schema, t.collapsed, Ext.Array.map(params, function (p) {
                                // checked
                                if (p.tbl == t.name)
                                    return p.field;
                                })
                            );
                        })

                        pstore.un('add', panel.paramChange, panel);

                        params.forEach(function (p) {
                            var param = { name: p.field, table: p.tbl },
                                rec = new QB.model.Param(p);

                            pstore.add(rec);
                            
                            me.curSQL.addParam(p.field);                // список алиасов
                            if (p.out) {
                                (p.alias) && (param.alias = p.alias);
                                me.curSQL.params.push(param);
                            }

                            (p.oper && p.userp) && (me.curSQL.uparams.push({ field: p.tbl + '.' + p.field, ft: p.ft, oper: p.oper, descr: p.descr, def: p.def }));
                            (p.oper1 && p.userp1) && (me.curSQL.uparams.push({ field: p.tbl + '.' + p.field, ft: p.ft, oper: p.oper1, descr: p.descr1, def: p.def1 }));
                        })

                        pstore.on('add', panel.paramChange, panel);                        
                        panel.ljoin.setValue(me.curSQL.useleftjoin);
                        panel.db2mode.setValue(me.curSQL.db2mode);
                        panel.userd.toggle(me.curSQL.userdefined);
                        panel.text.setValue(me.curSQL.sql);

                        if (reports.length > 0) {
                            panel.menu.add('-');
                            reports.forEach(function (r) {
                                panel.menu.add({ repId: r.id, text: r.name, iconCls: 'icon-xls', handler: function (item) { me.exec(me.print, item); }, scope: me });
                            })
                        }

                        obj.query.funcs.forEach(function (f) {
                            (!f.fnid && !f.name) && (f.name = f.body);
                            panel.funcsstore.add(new QB.model.Ufunc(f));
                        });                        

                        obj.query.uparams.forEach(function (u) {
                            me.curSQL.udparams.push(u);
                            panel.uparamsstore.add(new QB.model.Uparam(u));
                        })
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });

                    me.curSQL.loaded = true;
                    panel.el.unmask();
                },
                failure: function (response) { panel.el.unmask(); }
            });

            panel.group.setValue(grp);
            panel.qname.setValue(title); 
            
            var tstore = panel.tablesstore,
                rnd = tstore.getRootNode();

            Ext.Ajax.request({
                method: 'get',
                url: '/main/gettables',
                params: { name: conn.name, drv: conn.drv },
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        var nodes = obj.data || [];
                        (nodes.length > 0) && rnd.appendChild(nodes);
                    }
                },
                failure: function (response) { }
            });
        }
        else {
            panel = tab.items.getAt(0);
            tab.show();
        }        
    },

    editTable: function () {
        var me = this, table = me.SQLTable, drv = table.conn.drv,
            params = { table: table.name, name: table.conn.name, drv: drv };
        
        (drv == 0) && (params.od = table.od);
        me.grid.setLoading(true);

        Ext.Ajax.request({
            method: 'get',
            url: '/main/gettable',
            params: params,
            success: function (response) {
                var obj = Ext.decode(response.responseText);                

                if (obj.success) {     

                    obj.table.fields.forEach(function (f) {
                        f.out = (table.checks.indexOf(f.name) != -1);
                        (f.nt == 5) && (table.pks.push(f.name));

                        var rel = Ext.Array.findBy(table.rels, function (r) {
                            return (r.cols[0] == f.name);
                        });

                        (rel) && (f.joined = 1);
                    })

                    table.fields = obj.table.fields;
                    table.fkeys = obj.table.fkeys;

                    me.store.loadData([{ name: '*', out: (table.checks.indexOf('*') != -1) }].concat(table.fields));
                    me.fireEvent('tableload');
                }
                me.grid.setLoading(false);
            },
            failure: function (response) { me.grid.setLoading(false); }
        })
    },
   
    exec: function (fn, args) {
        var me = this, cfg, widget, wnd, form,
            query = me.curSQL,
            panel = query.panel,
            sql = panel.text.getValue();

        try
        {
            if (Auser.serverlogin && Auser.schema != query.conn.name) throw 'Вы не авторизованы в базе запроса!';        
            
            if (query.userdefined) {
                query.udparams = [];

                var store = panel.uparamsstore;

                if (store.getCount() > 0) {
                    wnd = Ext.widget('queryform', { drv: query.conn.drv, fn: fn, fnargs: args, sql: sql, userdefined: true });
                    form = wnd.form;
                    store.each(function (p, ix) {
                        cfg = { field: p.get('field'), fieldLabel: p.get('descr'), value: p.get('def'), allowBlank: false, ft: p.get('ft'), listeners: { change: wnd.updateSQLParam, scope: wnd } }

                        switch (cfg.ft) {
                            case 0:
                                widget = 'labelcombo';
                                cfg.labels = ['Нет', 'Да'];
                                break;
                            case 1:
                                widget = 'datefield';
                                cfg.format = 'd.m.Y';
                                break;
                            case 2:
                                widget = 'numberfield';
                                cfg.hideTrigger = true;
                                break;
                            default:
                                widget = 'textfield';
                                break;
                        }

                        form.insert(ix, Ext.widget(widget, cfg));
                    })
                    form.updateLayout();
                    wnd.updateSQLParam();
                    wnd.show();
                }
                else
                    fn.call(me, args);
            }
            else {
                query.args = [];
                query.multiargs = [];
                query.pars = [];

                if (query.uparams.length > 0) {
                    wnd = Ext.widget('queryform', { drv: query.conn.drv, fn: fn, fnargs: args, sql: sql });
                    form = wnd.form;

                    query.uparams.forEach(function (p, ix) {
                        cfg = { field: p.field, fieldLabel: p.descr, value: p.def, allowBlank: false, ft: p.ft, oper: p.oper, listeners: { change: wnd.updateSQLParam, scope: wnd } };

                        if (p.oper < 9) {
                            switch (p.ft) {
                                case 0:
                                    widget = 'labelcombo';
                                    cfg.labels = ['Нет', 'Да'];
                                    break;
                                case 1:
                                    widget = 'datefield';
                                    cfg.format = 'd.m.Y';
                                    break;
                                case 2:
                                    widget = 'numberfield';
                                    cfg.hideTrigger = true;
                                    break;
                                default:
                                    widget = 'textfield';
                                    break;
                            }
                        }
                        else {
                            var store = Ext.create('Ext.data.Store', { fields: ['text'] });

                            Ext.isDate(p.def) && (p.def = Ext.Date.format(p.def, 'd.m.Y'));
                            p.def.split(',').forEach(function (w) {
                                store.add({ text: w });
                            })
                            widget = 'combo';

                            cfg.store = store;
                            cfg.multiSelect = true;
                            cfg.queryMode = 'local';
                            cfg.value = p.def.split(',');
                        }
                        form.insert(ix, Ext.widget(widget, cfg));
                    })
                    form.updateLayout();
                    wnd.updateSQLParam();
                    wnd.show();
                }
                else
                    fn.call(me, args);
            }
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },
    
    execParam: function () {
        var me = this,
            query = me.curSQL,
            panel = query.panel,
            sql = panel.text.getValue();

        if (panel.items.getCount() == 2) {
            var tab = panel.items.last();
            panel.remove(tab);
        };
        
        var cols = [];        

        var store = Ext.create('QB.store.Lstore', {
            fields: [],
            pageSize: itemsPerPage,
            proxy: {
                actionMethods: { read: 'post' },
                extraParams: { id: query.id, sql: me.prepareSQL(), qname: panel.qname.getValue(), args: query.args },
                reader: {
                    idProperty: 'rn',
                    root: 'data',
                    getResponseData: function(response) {
                        var me = this, cnt = me.model.prototype.fields.getCount(),
                            data, error;
                        
                        try 
                        {
                            data = Ext.decode(response.responseText);

                            if (cnt <= 1 && data.data.length > 0)
                            {
                                var p, item = data.data[0], fields = [];                                                               

                                for (p in item) 
                                {   
                                    fields.push(p);
                                    (p != 'rn') && cols.push({ text: p.replace(new RegExp('&#pt;', 'g'), '.'), dataIndex: p });
                                }
                                data.metaData = { fields: fields };
                            }

                            return me.readRecords(data);
                        } 
                        catch (e) {
                            error = new Ext.data.ResultSet({
                                total: 0,
                                count: 0,
                                records: [],
                                success: false,
                                message: e.message
                            });
                        }

                        me.fireEvent('exception', me, response, error);
                        Ext.Logger.warn('Unable to parse the JSON returned by the server');
                        return error;
                    } 
                },
                timeout: connTimeout * 1000,
                url: '/main/execute'
            }            
        });

        if (query.conn) {
            store.proxy.extraParams.name = query.conn.name;
            store.proxy.extraParams.drv = query.conn.drv;
        }

        panel.el.mask('Выполнение', 'x-mask-loading');
        store.load({
            callback: function (recs, op, success) {
                panel.el.unmask();
                try {
                    if (!success) throw op.error.statusText;

                    if (op.response) {
                        var obj = Ext.decode(op.response.responseText);
                        if (!obj.success) throw obj.message;

                        panel.add({
                            title: 'Данные',
                            xtype: 'bargrid',
                            store: store,
                            tbarConfig: { enable: false },
                            columns: [{ xtype: 'rownumberer', resizable: true, width: 28 }].concat(cols)
                        }).show();
                    }
                }
                catch (e) {
                    Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                };
            }
        });
    },

    exportQuery: function () {
        var me = this, query = me.curSQL, name, drv, panel = query.panel;

        if (query.conn) {
            drv = query.conn.drv;
            name = query.conn.name;
        }

        var pars = (!query.userdefined) ? query.pars : query.udparams;

        panel.el.mask('Экспорт', 'x-mask-loading'),
        Ext.Ajax.request({
            url: '/report/export',
            params: { id: query.id, name: name, drv: drv, sql: me.prepareSQL(), json: Ext.encode(pars), qname: panel.qname.getValue(), group: panel.group.getValue(), subgroup: panel.subgroup.getValue(), userdefined: query.userdefined },
            timeout: connTimeout * 1000,
            success: function (response) {
                var obj = Ext.decode(response.responseText);

                if (obj.success)
                    window.location = obj.link;
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });

                panel.el.unmask();
            },
            failure: function (response) { panel.el.unmask(); }
        })
    },

    generateParams: function () {
        var query = this.curSQL,
            store = query.panel.uparamsstore;
            
        store.removeAll();
        query.generateParams().forEach(function (p) {
            store.add(new QB.model.Uparam({ field: p, ft: 3 }));
        });
    },

    getUserParams: function (btn) {
        var me = this,
            query = this.curSQL,            
            sql = query.panel.text.getValue(),
            wnd = btn.up('window'),
            form = wnd.form,
            baseform = form.getForm();

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';            
            
            if (query.userdefined) {
                var v;
                baseform.getFields().each(function (f) {
                    if (f.field) {
                        v = f.getValue();
                        (f.ft == 1) && (v = Ext.Date.format(v, 'd.m.Y'));
                        query.udparams.push({ descr: f.fieldLabel, field: f.field, def: v });
                    }
                })
            }
            else {

                var ix = 0;
                baseform.getFields().each(function (f) {
                    if (f.oper) {
                        ix++;

                        var need = true, v = f.getValue();
                        (f.ft == 1 && f.oper != 8) && (v = Ext.Date.format(v, 'd.m.Y'));

                        switch (f.oper) {
                            case 8:
                                v = '%' + v + '%';
                                break;
                            case 9:
                                v += '%';
                                break;
                            case 10:
                            case 11:
                                var nx = sql.nthIndexOf('?', ix);

                                if (nx != -1) {
                                    if (!Ext.isArray(v))
                                        v = [v];

                                    v = v.join(',');

                                    var words = [];
                                    v.split(',').forEach(function (w) {
                                        w = w.trimLeft();

                                        switch (f.ft) {
                                            case 1:
                                                w = '\'' + w + '\'';
                                                (query.conn.drv == 0) && (w = 'TO_DATE(' + w + ', \'DD.MM.YYYY\')');
                                                break;
                                            case 3:
                                                w = '\'' + w + '\'';
                                                break;
                                        }
                                        words.push(w);
                                    });

                                    query.multiargs.push({ nx: nx, q: words.join(', ') });
                                }
                                need = false;
                                break;
                        }
                        
                        need && query.args.push(v);
                        query.pars.push({ field: f.field, descr: f.fieldLabel, def: v });
                    }
                })
            }
            
            wnd.fn.call(me, wnd.fnargs);
            wnd.close();            
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    prepareSQL: function () {
        var me = this, offset = 0,
            query = me.curSQL,
            sql = query.panel.text.getValue();

        if (query.userdefined) {
            var pos;
            query.udparams.forEach(function (f) {

                pos = sql.indexOf(f.field);
                while (pos != -1) {
                    sql = sql.replace(f.field, f.def);
                    pos = sql.indexOf(f.field);
                }               
            })
        }
        else {
            query.multiargs.forEach(function (a) {
                a.nx += offset;
                var start = sql.substr(0, a.nx),
                    end = sql.substr(a.nx + 1);

                sql = start + a.q + end;
                offset += (a.q.length - 1);
            });
        }

        return sql;
    },

    print: function (item) {
        var me = this, query = me.curSQL, name, drv, panel = query.panel;

        if (query.conn) {
            drv = query.conn.drv;
            name = query.conn.name;
        }

        var pars = (!query.userdefined) ? query.pars : query.udparams;

        panel.el.mask('Формируется отчет', 'x-mask-loading'),
        Ext.Ajax.request({
            url: '/report/getreport',
            params: { id: query.id, name: name, drv: drv, sql: me.prepareSQL(), json: Ext.encode(pars), qname: panel.qname.getValue(), group: panel.group.getValue(), subgroup: panel.subgroup.getValue(), repid: item.repId, userdefined: query.userdefined },
            timeout: connTimeout * 1000,
            success: function (response) {
                var obj = Ext.decode(response.responseText);

                if (obj.success) {
                    window.location = obj.link;
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });

                panel.el.unmask();
            },
            failure: function (response) { panel.el.unmask(); }
        })
    },

    refreshQdbs: function () {
        var me = this, store = me.getQdbsStore();

        if (!store.loaded) {        

            var schemas = [];
            me.explorer.getRootNode().childNodes.forEach(function (nd) {
                schemas.push({ name: nd.get('name'), drv: nd.get('drv'), schema: nd.get('schema') });
            });
            store.loadData(schemas);
            store.loaded = true;
        }
    },

    refreshTables: function (btn) {
        var wnd = btn.up('window'), combo = wnd.combo;
        wnd.tree.clearSearch();
        this.showTables(combo, combo.getValue());
    },    

    showQueries: function () {
        var me = this, tab = me.centerRegion.child('#querytab');
        if (!tab) {
            var grid = Ext.widget('querylist', { enableAdd: Auser.isinrole('AUTHOR') });
            tab = me.centerRegion.add({ title: 'Запросы', itemId: 'querytab', layout: 'fit', items: [grid] });        
        }
        tab.show();
    },

    showRelations: function () {
        var query = this.curSQL, store = query.panel.relsstore;

        store.removeAll();
        query.relations.forEach(function(r){
            store.add(new QB.model.Rel(r));
        })

        Ext.widget('queryrlist', { query: query, store: store });
    },

    showReports: function () {
        var me = this,
            reps = me.curSQL.panel.menu.items.collect('repId'),
            store = me.getTemplatesStore(),            
            wnd = Ext.widget('reportlist');

        store.load({ callback: function () { wnd.selectTpl(reps); } });
    },

    showTables: function (field, newv) {        
        var me = this, conn = me.getQdbsStore().findRecord('name', newv || me.curSQL.conn.name), 
            tree = field.up('window').tree,
            store = me.curSQL.panel.tablesstore;

        tree.setLoading('Загрузка..');

        store.proxy.extraParams.name = conn.get('name');
        store.proxy.extraParams.drv = conn.get('drv');

        store.load({ callback: function () { tree.setLoading(false); }});
    },

    showUfuncs: function () {
        Ext.widget('queryfnlist', { store: this.curSQL.panel.funcsstore });
    },

    table: function () {
        var query = this.curSQL, conn = query.conn, store = query.panel.tablesstore,               
            wnd = Ext.widget('queryadd', { store: store });

        store.getRootNode().childNodes.forEach(function (child) {
            child.cascadeBy(function (nd) { nd.set('checked', false); })
        })
        
        wnd.combo.hide();
    },    

    updateQuery: function () {
        var me = this, 
            query = me.curSQL,
            panel = query.panel;            
        
        try {
            if (!panel.qname.validate() || !panel.group.validate()) throw 'Ошибка заполнения';            
            if (!query.userdefined && query.tables.length == 0) throw 'Выберите таблицы!';

            var ft, p, v, params = [];
            qname = panel.qname.getValue().replace(/,/gi, ''),
            group = panel.group.getValue(),
            subgroup = panel.subgroup.getValue();
                        
            query.panel.paramsstore.each(function (r) {
                ft = r.get('ft');
                p = { field: r.get('field'), formula: r.get('formula'), ft: ft };
            
                v = r.get('alias');
                v && (p.alias = v);

                v = r.get('out');
                v && (p.out = 1);

                v = r.get('schema');
                v && (p.schema = v);

                v = r.get('tbl');
                v && (p.tbl = v);

                v = r.get('tabix');
                v && (p.tabix = v);

                v = r.get('aggr');
                v && (p.aggr = v);

                v = r.get('ord');
                v && (p.ord = v);
                
                v = r.get('oper');
                v && (p.oper = v);

                v = r.get('descr');
                v && (p.descr = v);

                v = r.get('def');
                if (v !== ''){
                    (ft == 1) && (v = Ext.Date.format(v, 'd.m.Y'));
                    p.def = v;
                };

                v = r.get('uor');
                v && (p.uor = 1);

                v = r.get('userp');
                v && (p.userp = 1);

                v = r.get('oper1');
                v && (p.oper1 = v);

                v = r.get('descr1');
                v && (p.descr1 = v);

                v = r.get('def1');
                if (v !== '') {
                    (ft == 1) && (v = Ext.Date.format(v, 'd.m.Y'));
                    p.def1 = v;
                };

                v = r.get('uor1');
                v && (p.uor1 = 1);

                v = r.get('userp1');
                v && (p.userp1 = 1);

                v = r.get('filter2');
                v && (p.filter2 = v);

                v = r.get('uor2');
                v && (p.uor2 = 1);

                params.push(p);            
            });

            var reports = [];
            panel.menu.items.each(function(i) {
                (i.repId) && reports.push({ id: i.repId });
            })

            var tables = Ext.Array.map(query.tables, function (t) {
                return { name: t.table.name, od: t.table.od, schema: t.table.schema, collapsed: t.table.wnd.collapsed ? 1 : 0 };
            });

            var funcs = [];
            panel.funcsstore.each(function (f) {
                var v, func = { alias: f.get('alias'), def: f.get('def') },

                v = f.get('fnid');
                if (v) {
                    func.fnid = v;
                    func.args = f.get('args')
                }
                else
                    func.body = f.get('body');

                v = f.get('out');
                v && (func.out = v);

                v = f.get('outaggr');
                v && (func.outaggr = v);

                v = f.get('filter');
                v && (func.filter = v);

                v = f.get('filteraggr');
                v && (func.filteraggr = v);

                v = f.get('oper');
                v && (func.oper = v);

                v = f.get('uor');
                v && (func.uor = v);

                v = f.get('ord');
                v && (func.ord = v);

                v = f.get('ordaggr');
                v && (func.ordaggr = v);

                v = f.get('dir');
                v && (func.dir = v);

                funcs.push(func);
            })

            var udparams = [];
            panel.uparamsstore.each(function(p) {
                var def = p.get('def');
                (def != '' && p.get('ft') == 1) && (def = Ext.Date.format(def, 'd.m.Y'));
                
                udparams.push({ field: p.get('field'), ft: p.get('ft'), descr: p.get('descr'), def: def });
            });

            var q = {
                id: query.id, name: qname, conn: query.conn.name, group: group, subgroup: subgroup, db2mode: query.db2mode, useleftjoin: query.useleftjoin, userdefined: query.userdefined,
                funcs: funcs, params: params, relations: query.relations, reports: reports, tables: tables, uparams: udparams, sql: query.panel.text.getValue()
            };

            var ft, tab = me.centerRegion.child('#querytab');
            if (tab) {
                var grid = tab.child('querylist');

                if (grid) {
                    ft = grid.view.getFeature('grouping');
                    ft && ft.disable();
                }
            }

            panel.el.mask('Сохранение', 'x-mask-loading');

            Ext.Ajax.request({
                url: '/main/updatequery?id=' + q.id,
                params: { json: Ext.encode(q) },
                success: function (response) {
                    var obj = Ext.decode(response.responseText),
                        icon = Ext.MessageBox.INFO, msg = 'Запрос сохранен', title = 'Информация';
                    
                    if (obj.success) {
                        panel.ownerCt.setTitle(qname);

                        var store = me.getQueriesStore();
                        
                        if (panel.upd) {
                            var rec = store.findRecord('id', query.id, 0, false, false, true);
                            if (rec) {
                                rec.set({ name: qname, grp: group })
                                rec.commit();
                            }
                        }
                        else
                        {                            
                            query.id = obj.id;                                                        
                            store.add(new QB.model.Query({ id: query.id, name: qname, grp: group, conn: query.conn.name, drv: query.conn.drv }));
                            panel.upd = true;
                        }

                        store.sort('name', 'asc');                                              
                    }
                    else {
                        icon = Ext.MessageBox.WARNING;
                        msg = obj.message;
                        title = 'Внимание';
                    }

                    Ext.MessageBox.show({ title: title, msg: msg, buttons: Ext.MessageBox.OK, icon: icon });

                    ft && ft.enable();
                    panel.el.unmask();
                },
                failure: function (response) { ft && ft.enable(); panel.el.unmask(); }
            });
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    updateUfunc: function (btn) {
        var me = this, query = me.curSQL, wnd = btn.up('window'), form = wnd.form;

        try {            

            if (!form.isValid()) throw 'Ошибка заполнения';
            var ufunc = form.getValues();

            ufunc.out = ufunc.out || 0;
            ufunc.filter = ufunc.filter || 0;
            ufunc.ord = ufunc.ord || 0;

            if (ufunc.tp == 1) {
                var args = [], fn = wnd.combo.findRecord('id', ufunc.fnid), v;

                wnd.store.each(function (r) {
                    v = r.get('def');

                    switch (r.get('ft')) {
                        case 0:
                            v = v || 0;
                            args.push(v);
                            break;
                        case 1:
                            (v) && (args.push(Ext.Date.format(v, 'd.m.Y')));
                            break;
                        case 2:
                            (v != '') && (args.push(v));
                            break;
                        case 3:
                            args.push(v);
                            break;
                    }
                })

                if (args.length < wnd.fn.params.length) {
                    wnd.tabs.setActiveTab(1);
                    throw 'Необходимо заполнить нестроковые параметры!';
                }

                ufunc.args = args.join(';');
                ufunc.name = fn.get('name');
                ufunc.body = wnd.fn.body;
            }
            else {                
                ufunc.fnid = '';
                ufunc.name = ufunc.body;                
            }
            
            delete ufunc.tp;

            if (!ufunc.out && !ufunc.filter && !ufunc.ord) throw 'Необходимо включить функцию!';

            if (wnd.upd) {
                var rec = form.getRecord();
                rec.set(ufunc);
                rec.commit();
            }
            else {
                var store = query.panel.funcsstore;               
                store.add(ufunc);
                store.sort('name', 'asc');
            }
            wnd.close();
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    }
})