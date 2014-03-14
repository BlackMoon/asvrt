Ext.define('QB.controller.Template', {
    extend: 'QB.controller.Base',
    models: ['Template'],
    stores: ['Templates'],
    views: [ 'template.Edit', 'template.List' ],

    init: function () {
        var me = this;

        me.getTemplatesStore().on({ exception: me.onException, scope: me });

        me.control({
            'templateedit button[action=save]': {
                click: me.updateTpl
            },
            'templatelist': {
                additem: me.createTpl,
                edititem: me.editTpl,
                removeitem: me.deleteTpl
            },
            'toolbar [action=templates]': {
                click: me.showTemplates
            }
        });
    },    

    createTpl: function () {
        var view = Ext.widget('templateedit', { upd: false });
    },

    deleteTpl: function (view, rec, ix) {        

        Ext.Msg.confirm('Внимание', 'Удалить шаблон <b>' + rec.get('name') + '</b>?', function (btn) {
            if (btn == 'yes') {
                Ext.Ajax.request({
                    url: '/report/deletetpl',
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

    editTpl: function (grid, rec) {
        var readOnly = rec.get('readonly'), view = Ext.widget('templateedit', { readOnly: readOnly, btnSave: !readOnly });        
        view.form.loadRecord(rec);        
        view.ffield.inputEl.dom.value = rec.get('fname');        
    },

    updateTpl: function (btn) {
        var me = this, wnd = btn.up('window'), form = wnd.form;
        try {
            if (!form.isValid()) throw 'Ошибка заполнения';
            var tpl = form.getValues(),
                fname = wnd.ffield.getValue(),
                pos = fname.lastIndexOf('\\');

            tpl.fname = (pos == -1) ? fname : fname.substr(++pos);

            wnd.el.mask('Сохранение', 'x-mask-loading');
            form.submit({
                url: '/report/updatetpl',                
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
                    if (wnd.upd) {                        
                        (a.result.sz) && (tpl.sz = a.result.sz);
                        (!tpl.fname) && (delete tpl.fname);
                        
                        var rec = form.getRecord();
                        rec.set(tpl);                        
                        rec.commit(); 
                    }
                    else {
                        var store = me.getTemplatesStore();                        
                        tpl.id = a.result.id;
                        tpl.sz = a.result.sz;
                        store.add(tpl);
                        store.sort('name', 'asc');
                    }
                    wnd.close();                    
                }
            })
        }
        catch (e) {
            Ext.MessageBox.show({ title: 'Внимание', msg: e, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
        }
    },

    showTemplates: function () {
        var me = this, tab = me.centerRegion.child('#tpltab');
        if (!tab) {
            var grid = Ext.widget('templatelist', { enableAdd: Auser.isinrole('AUTHOR') });
            tab = me.centerRegion.add({ title: 'Шаблоны', itemId: 'tpltab', layout: 'fit', items: [grid] });
        }
        tab.show();
    }
})