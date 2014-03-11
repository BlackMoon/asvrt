Ext.define('QB.common.Labelcombo', {
    extend: 'Ext.form.ComboBox',
    alias: 'widget.labelcombo',
    queryMode: 'local',
    allowBlank: false,
    editable: false,
    defaultIx: 0,
    valueField: 'value',
    labels: [],
    offset: 0,

    initComponent: function () {
        var me = this;

        me.store = Ext.create('Ext.data.Store', { fields: [me.valueField, 'text'] });
        for (var i = 0; i < me.labels.length; ++i)
            me.store.add({ value: i + me.offset, text: me.labels[i] });

        me.callParent(arguments);

        if (me.store.getCount() > me.defaultIx) 
            me.originalValue = me.store.getAt(me.defaultIx).get(me.valueField);    
    }
})