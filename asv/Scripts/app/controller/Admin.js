var drvLabels = ['InterSystems Caché', 'IBM DB2'];

Ext.define('QB.controller.Admin', {
    extend: 'QB.controller.Base',    

    models: ['Alias', 'Connection', 'Fparam', 'Table', 'Udb', 'User' ],
    stores: ['Aliases', 'Catalogs', 'Conns', 'Funcs', 'Logs', 'Qdbs', 'Roles', 'Tables', 'Users'],
    views: ['Eventlog', 'alias.Edit', 'alias.List', 'conn.Edit', 'conn.List', 'func.Edit', 'func.List', 'catalog.Edit', 'catalog.List', 'setting.Edit', 'user.Edit', 'user.Import', 'user.List'],

    init: function () {
        var me = this;

        me.control({            
            'aliasedit button[action=save]': {
                click: me.updateAlias
            },
            'aliaslist': {
                additem: me.createAlias,
                edititem: me.editAlias,
                removeitem: me.deleteAlias
            },
            'catalogedit button[action=save]': {
                click: me.updateCatalog
            },
            'cataloglist': {
                additem: me.createCatalog,
                edititem: me.editCatalog,
                removeitem: me.deleteCatalog
            },
            'connedit button[action=save]': {
                click: me.updateConn
            },
            'connedit button[action=test]': {
                click: me.testConn
            },
            'connlist': {
                additem: me.createConn,
                edititem: me.editConn,
                removeitem: me.deleteConn
            },
            'funcedit button[action=save]': {
                click: me.updateFunc
            },
            'funclist': {
                additem: me.createFunc,
                edititem: me.editFunc,
                removeitem: me.deleteFunc
            },
            'eventlog toolbar button[action=export]': {
                click: function () { window.open('/admin/exportlogs', '_self'); }
            },
            'eventlog toolbar button[action=filter]': {
                click: me.filterEventLog
            },
            'toolbar [action=aliases]': {
                click: me.showAliases
            },
            'toolbar [action=catalogs]': {
                click: me.showCatalogs
            },
            'toolbar [action=conns]': {
                click: me.showConns
            },
            'toolbar [action=funcs]': {
                click: me.showFuncs
            },
            'toolbar [action=eventlog]': {
                click: me.showEventlog
            },
            'toolbar [action=settings]': {
                click: me.showSetting
            },
            'toolbar [action=users]': {
                click: me.showUsers
            },            
            'setedit button[action=save]': {
                click: me.updateSetting
            },
            'useredit': {
                show: function () { me.getConnsStore().load(); }
            },
            'useredit button[action=save]': {
                click: me.updateUser
            },
            'useredit grid gridcolumn[dataIndex=available]': {
                checkchange: me.addRole
            },
            'userimport button[action=importusers]': {
                click: me.importUsers
            },
            'userlist': {
                additem: me.createUser,
                edititem: me.editUser,
                removeitem: me.deleteUser
            },
            'userlist button[action=import]': {                
                click: function () { Ext.widget('userimport'); }
            }            
        });
    },

    onTableAdd: function(btn){
        var wnd = btn.up('window'), v,
            store = wnd.parent.store;

        wnd.grid.selected.forEach(function (rec) {
            v = rec.get('name');

            (store.find('name', v) == -1) && store.add(QB.model.Table({ name: v }));
        });        

        wnd.close();
    },    

    addRole: function (column, rowIx) {
        var view = column.up('grid').view,
            rowNode = view.getNode(rowIx),
            rec = view.getRecord(rowNode);

        rec.commit();
    },

    createAlias: function(){
        Ext.widget('aliasedit', { upd: false });
    },

    createCatalog: function () {
        var wnd = Ext.widget('catalogedit', { upd: false }),
            combo = wnd.combo,
            store = combo.store, rec;

        if (!store.loaded) {
            store.load({
                callback: function () {
                    rec = store.first();
                    rec && combo.setValue(rec.get('name'));
                }
            })
        }
        else {
            rec = store.first();
            rec && combo.setValue(rec.get('name'));
        }
    },

    createConn: function () {
        Ext.widget('connedit', { upd: false });
    },

    createFunc: function () {
        Ext.widget('funcedit', { upd: false });
    },

    createUser: function () {
        var wnd = Ext.widget('useredit', { upd: false }),
            store = wnd.rolesstore;
        
        store.actives = [];
        store.loaded && store.setActives();
    },

    deleteAlias: function(view, rec, ix){
        var name = rec.get('name');
        Ext.Msg.confirm('Внимание', 'Удалить псевдоним <b>' + name + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/admin/deletealias',
                    method: 'get',
                    params: { id: rec.get('id') },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        (obj.success) ? view.store.removeAt(ix) : showStatus(obj.message);                        
                    }                    
                });
            }
        })
    },

    deleteCatalog: function (view, rec, ix) {

        Ext.Msg.confirm('Внимание', 'Удалить раздел <b>' + rec.get('name') + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/admin/deletecatalog',
                    method: 'get',
                    params: { id: rec.get('id') },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        (obj.success) ? view.store.removeAt(ix) : showStatus(obj.message);                        
                    }                    
                });
            }
        })
    },

    deleteConn: function (view, rec, ix) {
        var name = rec.get('name');
        Ext.Msg.confirm('Внимание', 'Удалить соединение <b>' + name + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/admin/deleteconn',
                    method: 'get',
                    params: { name: name },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        (obj.success) ? view.store.removeAt(ix) : showStatus(obj.message);
                    }                    
                });
            }
        })
    },

    deleteFunc: function (view, rec, ix) {
        
        Ext.Msg.confirm('Внимание', 'Удалить функцию <b>' + rec.get('name') + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/admin/deletefunc',
                    method: 'get',
                    params: { id: rec.get('id') },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        (obj.success) ? view.store.removeAt(ix) : showStatus(obj.message);                   
                    }
                });
            }
        })
    },

    deleteUser: function (view, rec, ix) {
        var fio = rec.get('lastname') + ' ' + rec.get('firstname');
        rec.get('middlename') && (fio += ' ' + rec.get('middlename'));

        Ext.Msg.confirm('Внимание', 'Удалить пользователя <b>' + fio + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/admin/deleteuser',
                    method: 'get',
                    params: { id: rec.get('id') },
                    success: function (response) {
                        var obj = Ext.decode(response.responseText);
                        (obj.success) ? view.store.removeAt(ix) : showStatus(obj.message);
                    }                    
                });
            }
        })
    },

    editAlias: function(grid, rec){
        var view = Ext.widget('aliasedit');        

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getalias',
            params: { id: rec.get('id') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    var fields = obj.alias.fields || [];
                    fields.forEach(function (f) {
                        view.store.add(new QB.model.Alias(f));
                    })

                    view.form.loadRecord(rec);
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },

    editCatalog: function (grid, rec) {
        var view = Ext.widget('catalogedit');
        this.getConnsStore().load();

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getcatalog',
            params: { id: rec.get('id') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    var nodes = obj.catalog.nodes || [];
                    if (nodes.length > 0) {
                        var rnd = view.tstore.getRootNode();
                        rnd.appendChild(nodes);
                        view.tree.getSelectionModel().select(rnd.firstChild);
                    }
                    view.form.loadRecord(rec);
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },

    editConn: function (grid, rec) {
        var view = Ext.widget('connedit');

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getconn',
            params: { name: rec.get('name') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    view.form.loadRecord(rec);
                    view.form.getForm().setValues(obj.conn);
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },

    editFunc: function (grid, rec) {
        var view = Ext.widget('funcedit');

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getfunc',
            params: { id: rec.get('id') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {

                    var params = obj.func.params || [];
                    params.forEach(function (p) {
                        view.store.add(new QB.model.Fparam(p));
                    })

                    view.form.loadRecord(rec);
                    view.form.getForm().setValues(obj.func);
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },
    
    editUser: function (grid, rec) {
        var wnd = Ext.widget('useredit');

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/getuser',
            params: { id: rec.get('id') },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    var form = wnd.form,
                        store = wnd.rolesstore,
                        usr = obj.user;

                    store.actives = usr.roles || [];
                    store.loaded && store.setActives();

                    form.loadRecord(rec);
                    form.getForm().setValues(obj.user);

                    usr.bases.forEach(function (b) {
                        wnd.dbstore.add(new QB.model.Udb(b));
                    })
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) { }
        });
    },    

    filterEventLog: function (btn) {
        var grid = btn.up('grid'),
            filters = [],
            store = this.getLogsStore();            
            panel = grid.down('toolbar > container'),
            dtFrom = panel.getComponent('dateFrom').getValue(),
            dtTo = panel.getComponent('dateTo').getValue(),
            timeFrom = panel.getComponent('timeFrom').getValue(),
            timeTo = panel.getComponent('timeTo').getValue(),
            query = panel.getComponent('query').getValue();

        store.filters.clear();

        if (dtFrom) {

            if (timeFrom) {
                dtFrom = Ext.Date.add(dtFrom, Ext.Date.HOUR, timeFrom.getHours());
                dtFrom = Ext.Date.add(dtFrom, Ext.Date.MINUTE, timeFrom.getMinutes());
            }

            filters.push({ property: 'dtFrom', value: Ext.Date.format(dtFrom, 'd.m.Y H:i') });
        }

        if (dtTo) {
            if (timeTo) {
                dtTo = Ext.Date.add(dtFrom, Ext.Date.HOUR, timeTo.getHours());
                dtTo = Ext.Date.add(dtFrom, Ext.Date.MINUTE, timeTo.getMinutes());
            }

            filters.push({ property: 'dtTo', value: Ext.Date.format(dtTo, 'd.m.Y H:i') });
        }

        query && filters.push({ id: 'query', property: 'query', value: query });

        store.filter(filters);        
    },

    importUsers: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form;
        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var imp = form.getValues();            

            wnd.el.mask('Импорт', 'x-mask-loading');
            form.submit({
                url: '/admin/importusers',
                failure: function (f, a) {
                    wnd.el.unmask();

                    Ext.MessageBox.show({
                        title: 'Внимание',
                        msg: a.result.message,
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.WARNING
                    });
                },
                success: function (f, a) {
                    wnd.el.unmask();
                    me.getUsersStore().loadPage(1);

                    Ext.MessageBox.show({
                        title: 'Информация',
                        msg: 'Импортировано ' + a.result.message + ' пользователей',
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.INFO
                    });
                    wnd.close();
                }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },
      
    showAliases: function () {
        var me = this, tab = me.centerRegion.child('#aliastab');        
        !tab && (tab = me.centerRegion.add({ title: 'Псевдонимы', itemId: 'aliastab', layout: 'fit', items: [Ext.widget('aliaslist')] }));
        tab.show();
    },

    showCatalogs: function () {
        var me = this, tab = me.centerRegion.child('#catalogtab');
        !tab && (tab = me.centerRegion.add({ title: 'Каталоги', itemId: 'catalogtab', layout: 'fit', items: [Ext.widget('cataloglist')] }));
        tab.show();        
    },

    showConns: function () {
        var me = this, tab = me.centerRegion.child('#conntab');
        !tab && (tab = me.centerRegion.add({ title: 'Соединения', itemId: 'conntab', layout: 'fit', items: [Ext.widget('connlist')] }));
        tab.show();        
    },

    showFuncs: function () {
        var me = this, tab = me.centerRegion.child('#functab');
        !tab && (tab = me.centerRegion.add({ title: 'Функции', itemId: 'functab', layout: 'fit', items: [Ext.widget('funclist')] }));        
        tab.show();
    },

    showEventlog: function () {
        var me = this, tab = me.centerRegion.child('#logtab');
        !tab && (tab = me.centerRegion.add({ title: 'События', itemId: 'logtab', layout: 'fit', items: [Ext.widget('eventlog')] }));        
        tab.show();
    },

    showSetting: function () {
        var me = this, tab = me.centerRegion.child('#settab');
        !tab && (tab = me.centerRegion.add({ title: 'Настройки', itemId: 'settab', layout: 'fit', items: [Ext.widget('setedit')] }));        
        tab.show();
    },

    showUsers: function () {
        var me = this, tab = me.centerRegion.child('#usertab');
        !tab && (tab = me.centerRegion.add({ title: 'Пользователи', itemId: 'usertab', layout: 'fit', items: [Ext.widget('userlist')] }));        
        tab.show();
    },

    testConn: function (btn) {
        var wnd = btn.up('window');
        wnd.el.mask('Тест', 'x-mask-loading');

        Ext.Ajax.request({
            url: '/admin/testconn',
            params: { constr: wnd.constring.value },
            success: function (response) {
                var obj = Ext.decode(response.responseText),
                    icon = Ext.MessageBox.INFO,
                    msg = 'Тест успешен',
                    title = 'Информация';

                if (!obj.success) {
                    icon = Ext.MessageBox.WARNING
                    msg = obj.message;
                    title = 'Внимание';
                }

                Ext.MessageBox.show({
                    title: title,
                    msg: msg,
                    buttons: Ext.MessageBox.OK,
                    icon: icon
                })
                wnd.el.unmask();
            },
            failure: function (response) { wnd.el.unmask(); }
        })
    },

    updateAlias: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form, store = wnd.store;

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';

            var alias = form.getValues(), err, failed;
            (!alias.id) && (delete alias.id);
            
            alias.fields = [];
            store.each(function (f) {
                err = f.validate();

                if (err.length > 0) {
                    f.set('err', 1);
                    failed = 1;
                }
                else {
                    f.set('err', 0);
                    alias.fields.push({ id: f.get('id'), name: f.get('name'), remark: f.get('remark') });
                }                
            })            

            if (failed) throw 'Ошибка заполнения';                

            wnd.el.mask('Сохранение', 'x-mask-loading');

            Ext.Ajax.request({
                url: '/admin/updatealias',
                params: { json: Ext.encode(alias) },
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    delete alias.fields;

                    wnd.el.unmask();

                    if (obj.success) {                        
                        if (wnd.upd) {
                            var rec = form.getRecord();
                            rec.set(alias);
                            rec.commit();
                        }
                        else {
                            var store = me.getAliasesStore();
                            alias.id = obj.id
                            store.add(alias);
                            store.sort('name', 'asc');
                        }
                        wnd.close();
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                },
                failure: function (response) { wnd.el.unmask(); }
            })

        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    updateCatalog: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form, store = wnd.store;

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var catalog = form.getValues(), rec;

            (!catalog.id) && (delete catalog.id);

            catalog.nodes = [];
            wnd.tstore.getRootNode().childNodes.forEach(function (child) {
                child.cascadeBy(function (nd) {
                    rec = { name: nd.get('name'), internalid: nd.internalId, leaf: nd.isLeaf() ? 1 : 0 };
                    if (!nd.parentNode.isRoot())
                        rec.parentid = nd.parentNode.internalId;

                    catalog.nodes.push(rec);
                });
            });

            wnd.el.mask('Сохранение', 'x-mask-loading');
            Ext.Ajax.request({
                url: '/admin/updatecatalog',
                params: { json: Ext.encode(catalog) },
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    wnd.el.unmask();

                    if (obj.success) {
                        if (wnd.upd) {
                            var rec = form.getRecord();
                            rec.set(catalog);
                            rec.commit();
                        }
                        else {
                            var store = me.getCatalogsStore();
                            catalog.id = obj.id
                            store.add(catalog);
                            store.sort('name', 'asc');
                        }
                        wnd.close();
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                },
                failure: function (response) { wnd.getEl().unmask(); }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    updateConn: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form;

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var conn = form.getValues();

            wnd.el.mask('Сохранение', 'x-mask-loading');

            Ext.Ajax.request({
                url: '/admin/updateconn',
                params: conn,
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    wnd.el.unmask();

                    if (obj.success) {
                        if (wnd.upd) {
                            var rec = form.getRecord();
                            rec.set(conn);
                            rec.commit();
                        }
                        else {
                            var store = me.getConnsStore();
                            store.add(conn);
                            store.sort('name', 'asc');                            
                        }                        
                        wnd.close();
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                },
                failure: function (response) { wnd.getEl().unmask(); }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    updateFunc: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form, store = wnd.store;

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var func = form.getValues();

            (!func.id) && (delete func.id);

            func.params = [];
            store.each(function (p) {
                func.params.push({ descr: p.get('descr'), ft: p.get('ft') });
            })

            wnd.el.mask('Сохранение', 'x-mask-loading');
            Ext.Ajax.request({
                url: '/admin/updatefunc',
                params: { json: Ext.encode(func) },
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    wnd.el.unmask();

                    if (obj.success) {
                        func.args = func.params.length;

                        if (wnd.upd) {
                            var rec = form.getRecord();
                            rec.set(func);
                            rec.commit();
                        }
                        else {
                            var store = me.getFuncsStore();
                            func.id = obj.id
                            store.add(func);
                            store.sort('name', 'asc');
                        }
                        wnd.close();
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                },
                failure: function (response) { wnd.getEl().unmask(); }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },    
      
    updateSetting: function(btn){
        var form = btn.up('form'),
            panel = form.up('panel');
        
        try
        {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var setting = form.getValues();

            panel.el.mask('Сохранение', 'x-mask-loading');
            Ext.Ajax.request({
                url: '/admin/updatesettings',
                params: setting,
                success: function (response) {
                    var obj = Ext.decode(response.responseText),
                        icon = Ext.MessageBox.WARNING,
                        msg = obj.message,
                        title = 'Внимание';                        

                    if (obj.success) {
                        connTimeout = setting.conntimeout;
                        itemsPerPage = setting.itemsperpage;
                        minRequiredPasswordLength = setting.minrequiredpasswordlength;
                        minRequiredUsernameLength = setting.minrequiredusernamelength;

                        icon = Ext.MessageBox.INFO;
                        msg = 'Настройки сохранены';
                        title = 'Информация';
                    }
                    
                    panel.el.unmask();

                    Ext.MessageBox.show({
                        title: title,
                        msg: msg,
                        buttons: Ext.MessageBox.OK,
                        icon: icon
                    })
                },
                failure: function (response) { panel.el.unmask(); }
            })
        }        
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    updateUser: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form;

        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var usr = form.getValues();
            (!usr.id) && (delete usr.id);            

            if (usr.serverlogin) {
                var ix = wnd.dbstore.findBy(function (b) {
                    return (b.get('auth') && b.get('conn'));
                })
                if (ix == -1) throw 'Выберите базу для авторизации!';
            }            

            usr.isadmin = usr.isadmin || 0;
            usr.isapproved = usr.isapproved || 0;

            usr.roles = [];
            wnd.rolesstore.each(function (r) {
                r.get('active') && usr.roles.push(r.get('authority'));
            })

            usr.bases = [];
            wnd.dbstore.each(function (b) {
                b.get('conn') && usr.bases.push({ conn: b.get('conn'), auth: b.get('auth') ? 1 : 0 });
            })            

            wnd.el.mask('Сохранение', 'x-mask-loading');
            Ext.Ajax.request({
                url: '/admin/updateuser',
                jsonData: usr,                
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    wnd.el.unmask();

                    if (obj.success) {
                        me.getQdbsStore().loaded = false;

                        usr.locked = usr.locked || 0;
                        if (wnd.upd) {
                            var rec = form.getRecord();
                            rec.set(usr);
                            rec.commit();
                        }
                        else {
                            var store = me.getUsersStore();
                            usr.id = obj.id;
                            store.add(usr);
                            store.sort('login', 'asc');
                        }
                        wnd.close();
                    }
                    else
                        Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                },
                failure: function (response) { wnd.el.unmask(); }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    }
    
});