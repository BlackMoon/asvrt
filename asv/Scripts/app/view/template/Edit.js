Ext.apply(Ext.form.field.VTypes, {
    xlsfile: function (val, field) {
        var fileName = /^.*\.(xlsx|xls)$/i;
        return fileName.test(val);
    },   
    xlsfileText: "Выберите файл Microsoft Excel",   
    xlsfileMask: /[a-z_\.]/i
});

Ext.define('QB.view.template.Edit', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Updwnd'],
    alias: 'widget.templateedit',
    readOnly: false,
    title: 'Шаблон',
    height: 160,
    width: 480,

    initComponent: function () {
        var me = this;

        me.ffield = Ext.widget('filefield', { name: 'file', fieldLabel: 'Файл', labelWidth: 150, margin: '5', allowBlank: false, disabled: me.readOnly, vtype: 'xlsfile' });
        me.form = Ext.widget('form',
        {
            defaults: { anchor: '100%' },
            items: [{
                xtype: 'textfield',
                name: 'id',                
                hidden: true
            },
            {
                xtype: 'textfield',
                name: 'name',
                fieldLabel: 'Наименование',
                labelWidth: 150,
                margin: '5',
                allowBlank: false,
                readOnly: me.readOnly
            }, me.ffield ]
        });

        me.items = [me.form];

        me.callParent(arguments);
    }
});