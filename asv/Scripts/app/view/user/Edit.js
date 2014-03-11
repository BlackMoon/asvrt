var themes = [{ text: 'classic' }, { text: 'gray' }, { text: 'neptune' }];

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
    height: 540,
    width: 460,

    initComponent: function () {
        var me = this,
            conncombo = new Ext.form.field.ComboBox({ editable: false, store: 'Conns', displayField: 'name', valueField: 'name' }),
            login = Ext.form.TextField({ name: 'login', fieldLabel: 'Логин', anchor: '100%', labelWidth: 150, allowBlank: false }),
            themestore = Ext.create('Ext.data.Store', { fields: ['text'], data: themes });

        me.dbstore = Ext.create('Ext.data.Store', { model: 'QB.model.Udb' });
        me.rolestore = Ext.data.StoreManager.get('Roles');

        me.psw = Ext.widget('textfield', { name: 'password', fieldLabel: 'Пароль', inputType: 'password', anchor: '100%', allowBlank: me.upd, minLength: minRequiredPasswordLength, vtype: 'passwd', labelWidth: 140, loginField: login });        


        var usrtabs = Ext.widget('tabpanel', {
            items: [{
                title: 'Основные'
            },
            {
                title: 'Роли'
            },
            {
                title: 'Базы'
            },
            {
                title: 'Служебные',
                xtype: 'generalset'
            }]
        });


        /*me.form = Ext.widget('form',
        {   
            defaults: { anchor: '100%', labelWidth: 150, margin: '5' },
			items: [{
			    xtype: 'textfield',
		    	name: 'id',	    		    
    			hidden: true
    		}, login, 
            /*{
                xtype: 'textfield',
                name: 'login',
				fieldLabel: 'Логин',
                allowBlank: false
            },
            {
                xtype: 'checkboxfield',
                name: 'serverlogin',
                boxLabel: '&nbspАвторизоваться на сервере БД',                
                margin: '0 5 12 5',
                listeners: { change: me.toggleAuth, scope: me }
            },
			{
				xtype: 'fieldset',
                itemId: 'psws',
                title: me.upd ? 'Если вы не хотите менять пароль, оставьте поле пустым' : 'Минимальная длина пароля – ' + minRequiredPasswordLength + ' символов.',
                defaults: { anchor: '100%', labelWidth: 140 },
                cls: 'psw',
                margin: '0 5 12 5',
				items: [ me.psw,                    
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
                xtype: 'fieldcontainer',
                fieldLabel: 'Администратор',            
                defaults: { xtype: 'radiofield', name: 'isadmin' },
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
            },
            {
                xtype: 'combo',
                name: 'theme',                
                fieldLabel: 'Тема',
                store: themestore,
                editable: false,                
                valueField: 'text',
                value: 'classic'
            },
            {
                xtype: 'fieldset',
                title: 'Блокировка',
                defaults: { anchor: '100%' },
                margin: '12 5 0 5',
                items: [{
                    xtype: 'checkbox',
                    name: 'locked',
                    fieldLabel: 'Включить',
                    labelWidth: 139                    
                },
                {
                    xtype: 'textarea',
                    name: 'comment'                        
                }]
            }]			
        });

        me.items = [{ 
            xtype: 'tabpanel',
            defaults: { layout: 'fit' },
            items: [{
                title: 'Основные',                
                items: [me.form]
            },
            {
                title: 'Роли',
                items: [{
                    xtype: 'grid',
                    store: me.rolestore,
                    hideHeaders: true,
                    columns: [ { dataIndex: 'name', flex: 1, minWidth: 300 },
                               { xtype: 'checkcolumn', dataIndex: 'available', width: 120, align: 'center' }]                
                }]                
            },
            {
                title: 'Базы',
                items: [{
                    xtype: 'bargrid',
                    enableEdit: false,
                    bbarConfig: { enable: false },
                    tbarConfig: { enableSearch: false },
                    columns: [ { xtype: 'rownumberer' },
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
            }]
        }];*/

        me.items = [me.form = Ext.widget('form', { layout: 'fit', border: 0, frame: false, items: [usrtabs] })];
        me.callParent(arguments);        
        me.rolestore.load();        
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
        this.form.getComponent('psws').setDisabled(newv);
    },

    togglePassw: function(field, newv){
        this.psw.inputEl.set({ type: newv ? 'text' : 'password' });        
    }
});