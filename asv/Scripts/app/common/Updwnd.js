Ext.define('QB.Common.Updwnd', {
    extend: 'Ext.window.Window',
    autoShow: true,
    layout: 'fit',
    modal: true,
    btnClose: true,
    btnSave: true,    
    upd: true,

    initComponent: function () {
        var me = this;
        
        me.buttons = me.buttons || [];

        (me.btnSave) && 
            me.buttons.push({
                text: 'Сохранить',
                iconCls: 'icon-save',
                action: 'save'
            });

        (me.btnClose) &&
	        me.buttons.push({
	            text: 'Закрыть',
	            iconCls: 'icon-cancel',
	            handler: me.close,
	            scope: me
	        });

        me.callParent(arguments);
    }   
})
