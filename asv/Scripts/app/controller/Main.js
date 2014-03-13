Ext.define('QB.controller.Main', {
    extend: 'QB.controller.Base',
    logged: false,
    stores: ['Dbs'],
    views: ['user.Login'],    

    init: function () {
        var me = this;

        me.control({            
            'explorer': {
                itemcontextmenu: me.onItemContextMenu,                
                selectionchange: me.onSelectionChange
            },
            'explorer tool[action=refresh]': {
                click: me.refreshBases
            },
            'explorer tool[regionTool]': {
                click: me.onSetRegion
            },            
            'userlogin button[action=login]': {
                click: me.login
            }
        });
    },

    onItemContextMenu: function (view, rec, el, ix, e) {
        var me = this, panel = me.explorer,
            nt = panel.selNode.get('nt'),
            isSchema = (nt == 0),
            isTable = (nt == 1);
            
        panel.getSelectionModel().selectRange(ix, ix);
        
        e.stopEvent();

        var contextMenu = panel.contextMenu || (panel.contextMenu = 
            Ext.widget({
                xtype: 'menu',
                items: [ me.mnuquery = Ext.widget('menuitem', {
                    text: 'Новый запрос',
                    iconCls: 'icon-ljoin',            
                    action: 'query'                    
                }),
                me.mnutable = Ext.widget('menuitem', {
                    text: 'Выбрать первые 100 записей',
                    iconCls: 'icon-ljoin',
                    action: 'table',
                    disabled: true
                })]
            }));                
        
        me.mnutable.setVisible(isTable);

        contextMenu.showAt(e.getXY());                    
        
        return false;                
    },            

    onLaunch: function () {
        var me = this,
            menubar = me.application.viewport.down('toolbar[itemId=menubar]'),
            toolbar = me.application.viewport.down('toolbar[itemId=toolbar]');

        me.delbase = me.application.viewport.query('[action=delbase]') || [];        

        me.mnuadmin = menubar.getComponent('mnuadmin')
        me.btnauth = menubar.getComponent('btnauth');
        me.lbfio = menubar.getComponent('lbfio');

        me.btnaliases = toolbar.getComponent('aliases');
        me.btncatalogs = toolbar.getComponent('catalogs');
        me.btnconns = toolbar.getComponent('conns');
        me.btnfuncs = toolbar.getComponent('funcs');        
        me.btnsettings = toolbar.getComponent('settings');        
        me.btnusers = toolbar.getComponent('users');
        
        me.explorer = me.application.viewport.down('explorer');

        me.callParent(arguments);
        me.application.logged && me.refreshBases();
    },

    onSelectionChange: function (selmodel, selected) {        
        this.explorer.selNode = selected[0];        
    },

    onSetRegion: function (tool) {
        var panel = tool.toolOwner;

        var regionMenu = panel.regionMenu || (panel.regionMenu =
            Ext.widget({
                xtype: 'menu',
                items: [{
                    text: 'Сверху',
                    checked: (panel.region === 'north'),
                    group: 'mainregion',
                    handler: function () { panel.setBorderRegion('north'); }
                }, {
                    text: 'Снизу',
                    checked: (panel.region === 'south'),
                    group: 'mainregion',
                    handler: function () { panel.setBorderRegion('south'); }
                },
                {
                    text: 'Слева',
                    checked: (panel.region === 'west'),
                    group: 'mainregion',
                    handler: function () { panel.setBorderRegion('west'); }
                },
                {
                    text: 'Справа',
                    checked: (panel.region === 'east'),
                    group: 'mainregion',
                    handler: function () { panel.setBorderRegion('east'); }
                }]
            }));

        regionMenu.showBy(tool.el);
    },   

    auth: function (btn) {
        Ext.widget('userlogin');
    },    

    login: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form;
        try {
            var model = form.getValues();
            wnd.getEl().mask('Авторизация', 'x-mask-loading');

            Ext.Ajax.request({
                url: '/account/logon',
                params: model,
                success: function (response) {
                    var obj = Ext.decode(response.responseText);
                    wnd.el.unmask();

                    if (obj.success) {
                        me.application.logged = true;

                        [me.mnuadmin, me.btnaliases, me.btncatalogs, me.btnconns, me.btnfuncs, me.btnsettings, me.btnusers].forEach(function (b) {
                            b.setVisible(obj.isadmin);
                        })                        

                        me.lbfio.setText(obj.fio);
                        me.btnauth.setText('Выход');
                        
                        Auser.id = obj.id;
                        Auser.isadmin = obj.isadmin;
                        Auser.serverlogin = obj.serverlogin;
                        Auser.schema = obj.schema;
                        Auser.roles = obj.roles;

                        me.refreshBases();

                        wnd.close();
                    }
                    else
                        form.getForm().setValues({ msg: obj.message });
                },
                failure: function (response) { wnd.el.unmask(); }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    logoff: function () {
        var me = this;
        Ext.Ajax.request({
            url: '/account/logoff',
            method: 'get',
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    me.application.logged = false;

                    [me.mnuadmin, me.btnaliases, me.btncatalogs, me.btnconns, me.btnfuncs, me.btnsettings, me.btnusers].forEach(function (b) {
                        b.hide();
                    })
                    
                    me.lbfio.setText('');
                    me.btnauth.setText('Вход');

                    me.centerRegion.removeAll();
                    me.explorer.getRootNode().removeAll();
                }
            },
            failure: function (response) { }
        })
    },

    refreshBases: function(tool) {
        var store = this.getDbsStore(),
            root = store.getRootNode();

        store.clearFilter();

        root.collapse();
        root.removeAll();
        root.expand();        
    }
})