Ext.define('QB.view.base.Add', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Updwnd'],
    alias: 'widget.baseadd',
    title: 'Добавить базу',
    btnSave: false,
    width: 400,

    initComponent: function () {
        var me = this;

        me.combo = Ext.widget('combo', { name: 'schema', fieldLabel: 'Источник', displayField: 'name', valueField: 'name', editable: false, anchor: '100%', labelWidth: 150, margin: '5', store: 'Uconns' });
        me.form = Ext.widget('form',
        {
            items: [me.combo],
            listeners: { validitychange: function (f, v) { me.connbtn.setDisabled(!v); } }
        });

        me.items = [me.form];

        me.connbtn = Ext.widget('button', { text: 'OK', iconCls: 'icon-db', action: 'addbase', disabled: true })
        me.buttons = [me.connbtn];

        me.callParent(arguments);
    },

    doSetValue: function () {
        var combo = this.combo, v = combo.store.getAt(0);
        v && combo.setValue(v.get(combo.valueField));
    }
})