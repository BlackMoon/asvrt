Ext.define('QB.controller.Base', {
    extend: 'Ext.app.Controller',

    onException: function (opt, success) {
        var me = this;
        success && me.status.setText(opt);

        Ext.Function.defer(function () {
            me.status.setText('');
        }, 5000);
    },

    onLaunch: function () {
        var me = this;
        me.centerRegion = me.application.viewport.down('[region=center]');
        me.status = me.application.viewport.down('[region=south]').getComponent('status');
    }
})