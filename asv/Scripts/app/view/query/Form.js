Ext.define('QB.view.query.Form', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Updwnd'],
    alias: 'widget.queryform',
    autoShow: false,
    btnSave: false,
    maximizable: true,
    title: 'Параметры',
    width: 400,

    initComponent: function () {
        var me = this;

        me.form = Ext.widget('form', {
            defaults: { anchor: '100%', labelWidth: 150, margin: 5 },
            items: [{
                xtype: 'checkboxfield',
                boxLabel: '&nbspПоказать текст запроса',
                hideLabel: true,                
                handler: function (f, checked) { me.text.setVisible(checked); }
            },
            me.text = Ext.widget('displayfield', { fieldStyle: 'color: blue', value: me.sql, hidden: true }) ]
        })

        me.items = [me.form];        
        me.buttons = [{ text: 'OK', iconCls: 'icon-go', action: 'execparam' }];

        me.callParent(arguments);
    },

    updateSQLParam: function () {
        var me = this, baseform = me.form.getForm(), sqlp = me.sql, v;

        if (me.userdefined) {
            baseform.getFields().each(function (f) {
                v = f.getValue();
                
                (f.ft == 1) && (v = Ext.Date.format(v, 'd.m.Y'));

                var pos = sqlp.indexOf(f.field);
                while (pos != -1) {
                    sqlp = sqlp.replace(f.field, v);
                    pos = sqlp.indexOf(f.field);
                }                
            })
        }
        else {
            baseform.getFields().each(function (f) {
                if (f.oper) {
                    v = f.getValue();
                    (f.ft == 1 && f.oper != 9) && (v = Ext.Date.format(v, 'd.m.Y'));
                    (f.oper < 8 && (f.ft == 1 || f.ft == 3)) && (v = '\'' + v + '\'');

                    switch (f.oper) {
                        case 8:
                            v = '\'%' + v + '%\'';
                            break;
                        case 9:
                            v = '\'' + v + '%\'';
                            break;
                        case 10:
                        case 11:
                            if (!Ext.isArray(v))
                                v = [v];

                            v = v.join(',');

                            var words = [];
                            v.split(',').forEach(function (w) {
                                w = w.trimLeft();
                                switch (f.ft) {
                                    case 1:
                                        w = '\'' + w + '\'';
                                        (me.drv == 0) && (w = 'TO_DATE(' + w + ', \'DD.MM.YYYY\')');
                                        break;
                                    case 3:
                                        w = '\'' + w + '\'';
                                        break;
                                }
                                words.push(w);
                            });

                            v = words.join(', ');
                            break;
                    }

                    sqlp = sqlp.replace('?', v);
                }
            });
        }

        me.text.setValue(sqlp);
    }
})

