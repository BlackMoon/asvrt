Ext.define('QB.common.Xform', {
    extend: 'Ext.form.Panel',
    alias: 'widget.xform',

    findInvalidL: function () {
        var result = [];

        this.getForm().getFields().each(function (f) {
            !f.disabled && f.hasCls(f.invalidCls) && result.push(f.fieldLabel);
        });
        
        return result;
    }
})