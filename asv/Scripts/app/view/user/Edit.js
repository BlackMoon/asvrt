var themes = [{ text: 'classic' }, { text: 'gray' }, { text: 'neptune' }];

Ext.apply(Ext.form.field.VTypes, {
    login: function (v) {
        return /^\w+$/.test(v);
    },
    loginText: 'Можно использовать только буквы латинского алфавита (a–z), цифры и знак подчеркивания(\'_\').'
});

Ext.apply(Ext.form.field.VTypes, {
    passwd: function (v, field) {
        var login = field.loginField.getValue();
        if (login)
            return (v != login);

        return true;
    },
    passwdText: 'Пароль не должен совпадать с логином.'
});

Ext.define('QB.view.user.Edit', {
    extend: 'QB.common.Updwnd',
    requires: [ 'QB.common.Generalset', 'QB.common.Updwnd' ],
    alias: 'widget.useredit',
    title: 'Пользователь',
    height: 460,
    width: 480,

    initComponent: function () {
        var me = this,
            conncombo = Ext.widget('combo', { editable: false, store: 'Conns', displayField: 'name', valueField: 'name', submitValue: false }),
            login = Ext.widget('textfield', { name: 'login', fieldLabel: 'Логин', anchor: '100%', minLength: minRequiredUsernameLength, vtype: 'login', labelWidth: 140, allowBlank: false,
                validator: function (v) {
                    return (v[0] !== '_') || 'Первый символ должен быть латинской буквой (a–z) или цифрой.';
                }
            }),
            themestore = Ext.create('Ext.data.Store', { fields: ['text'], data: themes });

        me.dbstore = Ext.create('Ext.data.Store', { model: 'QB.model.Udb' });
        me.rolesstore = Ext.getStore('Roles');

        me.psw = Ext.widget('textfield', { name: 'password', fieldLabel: 'Пароль', inputType: 'password', anchor: '100%', allowBlank: me.upd, minLength: minRequiredPasswordLength, vtype: 'passwd', labelWidth: 140, loginField: login });        
        var usrtabs = Ext.widget('tabpanel', {
            items: [{
                title: 'Основные',
                frame: true,
                layout: 'anchor',
                defaults: { anchor: '100%', labelWidth: 150, margin: '5' },
                items: [{
                    xtype: 'textfield',
                    name: 'id',
                    hidden: true
                },
                {
                    xtype: 'fieldset',
                    padding: '5 10 0',
                    items: [login,
                    {
                        xtype: 'checkboxfield',
                        name: 'serverlogin',
                        boxLabel: '&nbspАвторизоваться на сервере БД',
                        listeners: { change: me.toggleAuth, scope: me }
                    }]
                },                
                {
                    xtype: 'fieldset',
                    itemId: 'psws',
                    title: me.upd ? 'Если вы не хотите менять пароль, оставьте поле пустым' : 'Минимальная длина пароля – ' + minRequiredPasswordLength + ' символов.',                    
                    cls: 'psw',
                    margin: '0 5 12 5',
                    items: [me.psw,
                    {
                        xtype: 'checkbox',
                        fieldLabel: 'Показать пароль',
                        listeners: { change: me.togglePassw, scope: me }
                    }]
                },
                {
                    xtype: 'textfield',
                    name: 'lastname',
                    itemId: 'lastname',
                    fieldLabel: 'Фамилия',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    name: 'firstname',
                    itemId: 'firstname',
                    fieldLabel: 'Имя',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    name: 'middlename',
                    fieldLabel: 'Отчество'
                },
                {
                    xtype: 'combo',
                    name: 'theme',
                    fieldLabel: 'Тема',
                    store: themestore,
                    editable: false,
                    valueField: 'text',
                    value: 'classic'
                }]
            },
            {
                title: 'Роли',
                layout: { type: 'vbox', align: 'stretch' },
                items: [
                {
                    xtype: 'grid',
                    store: me.rolesstore,
                    hideHeaders: true,
                    columns: [{ dataIndex: 'name', flex: 1, minWidth: 300 },
                              {
                                  xtype: 'checkcolumn',
                                  dataIndex: 'active',
                                  width: 120,
                                  align: 'center',
                                  listeners: {
                                      checkchange: function (column, rowIx) {
                                          var me = this,
                                              view = column.up('grid').view,
                                              rowNode = view.getNode(rowIx),
                                              rec = view.getRecord(rowNode);

                                          rec && rec.commit();
                                      }
                                  }
                              }],
                    flex: 1
                },
                {
                    xtype: 'panel',
                    frame: true,
                    layout: 'anchor',
                    defaults: { margin: '5' },
                    items: [{
                        xtype: 'fieldcontainer',
                        fieldLabel: 'Администратор',
                        defaults: { xtype: 'radiofield', name: 'isadmin' },
                        labelWidth: 150,
                        layout: 'hbox',
                        items: [{
                            boxLabel: 'Да',
                            inputValue: 1,
                            width: 186
                        },
                        {
                            boxLabel: 'Нет',
                            inputValue: null,
                            checked: 1
                        }]
                    }]
                }]
            },
            {
                title: 'Базы',
                items: [{
                    xtype: 'bargrid',
                    enableEdit: false,
                    bbarConfig: { enable: false },
                    tbarConfig: { enableSearch: false },                    
                    columns: [{ xtype: 'rownumberer' },
                    {
                        text: 'Наименование',
                        dataIndex: 'conn',
                        minWidth: 200,
                        flex: 3,
                        editor: conncombo,
                        renderer: comboRenderer(conncombo)
                    },
                    {
                        xtype: 'checkcolumn',
                        dataIndex: 'auth',
                        text: 'Для авторизации',
                        flex: 1,
                        listeners: {
                            checkchange: function (column, rowIx, checked) {
                                var me = this, rec,
                                    view = column.up('grid').view,
                                    rowNode = view.getNode(rowIx);
                                // find prev checked rec
                                if (checked && me.dbstore.getCount() > 1) {
                                    var ix = me.dbstore.findBy(function (r) {
                                        return (!r.dirty && r.get('auth'));
                                    })

                                    if (ix != -1) {
                                        rec = me.dbstore.getAt(ix);
                                        rec.set('auth', 0);
                                        rec.commit();
                                    }
                                }

                                rec = view.getRecord(rowNode);                                
                                rec.commit();
                            },
                            scope: me
                        }
                    }],
                    listeners: { additem: me.addRow, removeitem: me.removeRow },
                    plugins: [{
                        pluginId: 'celleditor',
                        ptype: 'cellediting',
                        clicksToEdit: 1,
                        listeners: {
                            edit: function (editor, e) { e.record.commit(); }
                        }
                    }],
                    store: me.dbstore
                }]
            },
            {
                title: 'Служебные',
                frame: true,
                layout: 'anchor',
                defaults: { margin: '5' },
                items: [{
                    xtype: 'fieldset',
                    title: 'Блокировка',
                    defaults: { anchor: '100%' },
                    items: [{
                        xtype: 'checkbox',
                        name: 'isapproved',
                        fieldLabel: 'Включить'
                    },
                    {
                        xtype: 'textarea',
                        name: 'comment',
                        inputAttrTpl: 'title=\'Причина\''
                    }]
                },
                {
                    xtype: 'generalset'
                }]
            }]
        });

        me.items = [me.form = Ext.widget('form', { layout: 'fit', border: 0, frame: false, items: [usrtabs] })];
        me.callParent(arguments);        
        me.rolesstore.load();        
    },

    addRow: function (view) {
        var me = this;
        me.store.add(new QB.model.Udb());
        view.getPlugin('celleditor').startEdit(me.store.getCount() - 1, 0);
    },    

    removeRow: function (view, rec, ix) {
        view.store.removeAt(ix);
    },    

    toggleAuth: function (field, newv) {
        this.form.down('fieldset[itemId=psws]').setDisabled(newv);
    },

    togglePassw: function(field, newv){
        this.psw.inputEl.set({ type: newv ? 'text' : 'password' });        
    }
});