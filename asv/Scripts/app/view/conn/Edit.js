Ext.define('QB.view.conn.Edit', {
    extend: 'QB.Common.Updwnd',
    requires: ['QB.Common.Labelcombo', 'QB.Common.Updwnd'],
    alias: 'widget.connedit',
    title: 'Соединение',
    height: 480,
    width: 480,

    initComponent: function () {
        var me = this;

        me.constring = Ext.widget('displayfield', { height: 76, fieldLabel: 'Источник данных', labelWidth: 150, fieldStyle: 'color: blue', labelStyle: 'color: blue', value: 'DRIVER={InterSystems ODBC};' });
        me.form = Ext.widget('form',
        {
            defaults: { anchor: '100%', labelWidth: 150, margin: '5', listeners: { change: me.updateConString } },
            items: [{
                xtype: 'textfield',
                name: 'name',
                fieldLabel: 'Наименование',
                fieldStyle: 'color: ' + (me.upd ? '#888888' : 'black'),
                readOnly: me.upd,                
                allowBlank: false
            },
            {
                xtype: 'labelcombo',
                name: 'driver',
                fieldLabel: 'Драйвер',
                labels: drvLabels,
                value: 0                
            },
            {
                xtype: 'textfield',
                name: 'server',
                fieldLabel: 'Сервер'                
            },
            {
                xtype: 'fieldcontainer',
                layout: 'hbox',
                defaults: { listeners: { change: me.updateConString } },
                items: [{
                    xtype: 'labelcombo',
                    name: 'protocol',
                    fieldLabel: 'Протокол',
                    labelWidth: 150,
                    width: 240,
                    margin: '0 40 0 0',
                    labels: ['TCP'],
                    submitValue: false,
                    value: 0                    
                },
                {
                    xtype: 'numberfield',
                    name: 'port',
                    fieldLabel: 'Порт',
                    hideTrigger: true,
                    labelWidth: 60,
                    flex: 1                    
                }]
            },
            {
                xtype: 'textfield',
                name: 'database',
                fieldLabel: 'База данных'                
            },
            me.schema = Ext.widget('textfield', {
                name: 'schema',
                itemId: 'schema',
                fieldLabel: 'Схема',
                labelWidth: 150,
                hidden: true,
                listeners: { change: me.updateConString }
            }),
            {
                xtype: 'fieldset',
                margin: '12 5 5 5',
                defaults: { anchor: '100%', labelWidth: 139, listeners: { change: me.updateConString }},
                items: [{
                    xtype: 'textfield',
                    name: 'uid',
                    fieldLabel: 'Пользователь',
                    margin: '5 0 5 0'                    
                },
                {
                    xtype: 'textfield',
                    name: 'pwd',
                    fieldLabel: 'Пароль',
                    inputType: 'password'                    
                }]
            },
            {
                xtype: 'checkboxfield',
                name: 'hidesys',
                boxLabel: '&nbsp;Не показывать таблицы вне разделов'
            }, me.constring,
            {
                xtype: 'textfield',
                name: 'wsdl',
                fieldLabel: 'Веб-служба авторизации'
            },
            {
                xtype: 'checkboxfield',
                name: 'hidesys',
                boxLabel: '&nbsp;Не показывать таблицы вне разделов'
            },            
            me.constring,
            {
                xtype: 'fieldcontainer',
                layout: 'hbox',
                margin: '12 0 0 5',
                items: [{
                    xtype: 'button',
                    text: 'Тест соединения',
                    action: 'test'                    
                }]
            }]
        });

        me.items = [me.form];

        me.callParent(arguments);
    },

    updateConString: function (field, newv) {
        var form = this.up('form'), wnd = form.up('window'), con = form.getValues(), setting = 'DRIVER=';
        
        (field.name == 'driver') && (wnd.schema.setVisible(newv));

        switch (con.driver) {
            case 0:
                setting += '{InterSystems ODBC}; ';                
                break;
            case 1:
                setting += '{IBM DB2 ODBC DRIVER}; PROTOCOL=TCPIP; ';
                (con.schema) && (setting += 'CURRENTSCHEME=' + con.schema + '; ');
                break;
        }

        (con.server) && (setting += (con.driver == 0 ? 'SERVER=' : 'HOSTNAME=') + con.server + '; ');        
        (con.port) && (setting += 'PORT=' + con.port + '; ');
        (con.database) && (setting += 'DATABASE=' + con.database + '; ');        
        (con.uid) && (setting += 'UID=' + con.uid + '; ');
        (con.pwd) && (setting += 'PWD=' + con.pwd + '; ');

        wnd.constring.setValue(setting);
    }
});