Ext.define('QB.view.user.Login', {
    extend: 'Ext.window.Window',
    alias: 'widget.userlogin',

    title: 'Авторизация',
    autoShow: true,
    closable: false,
    modal: true,    
    width: 288,

    listeners: { show: function () { this.form.getComponent('login').focus(); } },

    initComponent: function () {
        var me = this;

        me.form = Ext.widget('form',
        {            
            defaults: { xtype: 'textfield', anchor: '100%', allowBlank: false, margin: '5' },
            items: [{
                name: 'login',
                itemId: 'login',
                fieldLabel: 'Пользователь',                
                listeners: {
                    afterrender: function (cmp) {
                        cmp.inputEl.set({ autocomplete: 'on' });
                    },
                    specialkey: me.submitOnEnter,
                    scope: me
                }
            },
			{
			    name: 'password',
			    fieldLabel: 'Пароль',
			    inputType: 'password',
                listeners: { specialkey: me.submitOnEnter, scope: me }                			    
			},
            {
                xtype: 'checkbox',
                name: 'rememberme',
                fieldLabel: 'Запомнить',
                inputValue: 'true',
                checked: true
            },
            {
                xtype: 'displayfield',
                name: 'msg',
                cls: 'x-red',
                margin: '12 5 5 5'                                 
            }],
            listeners: {
                validitychange: function (f, v) { me.loginbtn.setDisabled(!v); }
            }
        });

        me.items = [me.form];

        me.loginbtn = Ext.widget('button', { text: 'Вход', iconCls: 'icon-lock', action: 'login', disabled: true });
        me.buttons = [me.loginbtn,
		{
		    text: 'Отмена',
		    iconCls: 'icon-cancel',
		    handler: me.close,
		    scope: me
		}];

        me.callParent(arguments);
    },

    submitOnEnter: function(f, e){        
        var me = this;
        if (e.getKey() == e.ENTER && me.form.getForm().isValid()) {            
		    me.loginbtn.fireEvent('click', me.loginbtn);
	    }
    }
});