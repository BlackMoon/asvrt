var drvLabels = ['InterSystems Caché', 'IBM DB2'];

Ext.define('QB.controller.Admin', {
    extend: 'QB.controller.Base',    

    models: ['Alias', 'Connection', 'Fparam', 'Table', 'Udb', 'User' ],
    stores: ['Aliases', 'Catalogs', 'Conns', 'Funcs', 'Qdbs', 'Roles', 'Tables', 'Users'],
    views: ['alias.Edit', 'alias.List', 'conn.Edit', 'conn.List', 'func.Edit', 'func.List', 'catalog.Edit', 'catalog.List', 'setting.Edit', 'user.Edit', 'user.Import', 'user.List'],

    init: function () {
        var me = this;

        me.control({                        
            'aliasedit button[action=save]': {
                click: me.updateAlias
            },            
            'connedit button[action=save]': {
                click: me.updateConn
            },
            'connedit button[action=test]': {
                click: me.testConn
            },
            'funcedit button[action=save]': {
                click: me.updateFunc
            },            
            'catalogedit button[action=save]': {
                click: me.updateCatalog
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
            'userlist button[action=import]': {
                click: function () { Ext.widget('userimport'); }
            },
            'userlist gridcolumn[dataIndex=locked]': {
                checkchange: me.lockChange
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
        Ext.widget('useredit', { upd: false });
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
                        (obj.success) ? view.store.removeAt(ix) : 
                    	    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                    },
                    failure: function (response) { }
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
                        (obj.success) ? view.store.removeAt(ix) :
                    	    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                    },
                    failure: function (response) { }
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
                        (obj.success) ? view.store.removeAt(ix) : 
                    	    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                    },
                    failure: function (response) { }
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
                        (obj.success) ? view.store.removeAt(ix) :
                    	    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
                    },
                    failure: function (response) { }
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
                        if (obj.success)
                            view.store.removeAt(ix);
                    },
                    failure: function (response) { }
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
                        store = wnd.rolestore,
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

    lockChange: function (column, rowIx, checked) {
        var view = column.up('grid').view, rowNode = view.getNode(rowIx), rec = view.getRecord(rowNode);

        Ext.Ajax.request({
            method: 'get',
            url: '/admin/lockuser',
            params: { id: rec.get('id'), locked: checked ? 1 : 0 },
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                rec[obj.success ? 'commit' : 'reject']();
            },
            failure: function (response) { }
        });
    },
     
    showAliases: function () {
        var me = this, tab = me.centerRegion.child('#aliastab');
        if (!tab) {
            var grid = Ext.widget('aliaslist', { listeners: { additem: me.createAlias, edititem: me.editAlias, removeitem: me.deleteAlias } });
            tab = me.centerRegion.add({ title: 'Псевдонимы', itemId: 'aliastab', layout: 'fit', items: [grid] });
        }
        tab.show();
    },

    showCatalogs: function () {
        var me = this, tab = me.centerRegion.child('#catalogtab');
        if (!tab) {
            var grid = Ext.widget('cataloglist', { listeners: { additem: me.createCatalog, edititem: me.editCatalog, removeitem: me.deleteCatalog, scope: me } });
            tab = me.centerRegion.add({ title: 'Каталоги', itemId: 'catalogtab', layout: 'fit', items: [grid] });
        }
        tab.show();
    },

    showConns: function () {
        var me = this, tab = me.centerRegion.child('#conntab');
        if (!tab) {
            var grid = Ext.widget('connlist', { listeners: { additem: me.createConn, edititem: me.editConn, removeitem: me.deleteConn } });
            tab = me.centerRegion.add({ title: 'Соединения', itemId: 'conntab', layout: 'fit', items: [grid] });
        }
        tab.show();
    },

    showFuncs: function () {
        var me = this, tab = me.centerRegion.child('#functab');
        if (!tab) {
            var grid = Ext.widget('funclist', { listeners: { additem: me.createFunc, edititem: me.editFunc, removeitem: me.deleteFunc } });
            tab = me.centerRegion.add({ title: 'Функции', itemId: 'functab', layout: 'fit', items: [grid] });
        }
        tab.show();
    },

    showSetting: function () {
        var me = this, tab = me.centerRegion.child('#settab');
        if (!tab) {
            var view = Ext.widget('setedit');            
            tab = me.centerRegion.add({ title: 'Настройки', itemId: 'settab', layout: 'fit', items: [view] });            
        }
        tab.show();
    },

    showUsers: function () {
        var me = this, tab = me.centerRegion.child('#usertab');
        if (!tab) {
            var grid = Ext.widget('userlist', { listeners: { additem: me.createUser, edititem: me.editUser, removeitem: me.deleteUser } });            
            tab = me.centerRegion.add({ title: 'Пользователи', itemId: 'usertab', layout: 'fit', items: [grid] });
        }
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
            else {
                if (usr.password.length > 0 && usr.password.length < 6) throw 'Минимальная длина пароля - 6 символов!';
            }

            usr.roles = [];
            wnd.rolestore.each(function (r) {
                r.get('available') && usr.roles.push(r.get('authority'));
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