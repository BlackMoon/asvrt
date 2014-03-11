Ext.apply(Ext.form.field.VTypes, {
    number: function (v, field) {
        return v >= 0;
    },
    numberText: 'Должно быть неотрицательное число.'
});

Ext.define('QB.view.setting.Edit', {
    extend: 'Ext.container.Container',
    alias: 'widget.setedit',
    cls: 'x-panel-body-default-framed',
    layout: { type: 'hbox', align: 'stretch' },

    initComponent: function () {
        var me = this;

        me.items = [me.form = Ext.widget('form', {
            width: 440,
            defaults: { xtype: 'fieldset', margin: '5' },
            items: [{
                title: 'Соединение',
                defaults: { xtype: 'numberfield', allowDecimals: false, hideTrigger: true, vtype: 'number', anchor: '100%', labelWidth: 300, allowBlank: false },
                items: [{                    
                    name: 'conntimeout',
                    fieldLabel: 'Время ожидания, с',
                    value: 300                    
                }]
            },
            {
                title: 'Запрос',
                defaults: { xtype: 'numberfield', allowDecimals: false, hideTrigger: true, vtype: 'number', anchor: '100%', labelWidth: 300, allowBlank: false },
                items: [{                    
                    name: 'itemsperpage',
                    fieldLabel: 'Записей на странице',                                        
                    value: 50                    
                }]
            },
            {
                title: 'Логин',
                defaults: { xtype: 'numberfield', allowDecimals: false, hideTrigger: true, vtype: 'number', anchor: '100%', labelWidth: 300, allowBlank: false },
                items: [{
                    name: 'minrequiredusernamelength',
                    fieldLabel: 'Минимальная длина',
                    value: 7
                }]
            },
            {
                title: 'Пароль',
                defaults: { xtype: 'numberfield', allowDecimals: false, hideTrigger: true, vtype: 'number', anchor: '100%', labelWidth: 300, allowBlank: false },
                items: [{
                    name: 'minrequiredpasswordlength',
                    fieldLabel: 'Минимальная длина',
                    value: 7
                },
                {
                    name: 'saltlength',
                    fieldLabel: 'Длина случайного набора символов (соль)',
                    value: 16
                }]
            },
            {
                title: 'Блокировка',
                defaults: { xtype: 'numberfield', allowDecimals: false, hideTrigger: true, vtype: 'number', anchor: '100%', labelWidth: 300, allowBlank: false },
                items: [{
                    name: 'maxinvalidpasswordattempts',
                    fieldLabel: 'Максимальное кол-во неверных попыток входа',
                    value: 5
                },
                {
                    name: 'passwordanswerattemptlockoutduration',
                    fieldLabel: 'Время, мин',
                    value: 10
                }]
            }],
            buttons: [{
                text: 'Сохранить',
                iconCls: 'icon-save',
                action: 'save'
            }]
        })];

        me.callParent(arguments);

        Ext.Ajax.request({
            url: '/admin/getsettings',
            method: 'get',
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    var setting = obj.settings;
                    setting.conntimeout = connTimeout;
                    setting.itemsperpage = itemsPerPage;
                    setting.minrequiredpasswordlength = minRequiredPasswordLength;
                    setting.minrequiredusernamelength = minRequiredUsernameLength;
                    
                    me.form.getForm().setValues(setting);                    
                }
                else
                    Ext.MessageBox.show({ title: 'Внимание', msg: obj.message, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING });
            },
            failure: function (response) {
                showStatus(response.status + ' ' + response.statusText);
            }
        })

    }
})