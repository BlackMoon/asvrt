Ext.define('QB.common.Imagecolumn', {
    extend: 'QB.common.Stylecolumn',
    alias: 'widget.imagecolumn',
    align: 'center',
    alter: true,    
    tooltip: false,

    constructor: function (cfg) {
        var me = this;
        me.callParent(arguments);

        me.renderer = function (v, m) {
            (me.tooltip) && (m.tdCls += 'tt');

            if (me.alter) {
                if (v && me.img)
                    return '<img src="' + me.img + '" />';
            }
            else {
                var s = '';
                (me.img) && (s = '<img src="' + me.img + '" /><img src="' + Ext.BLANK_IMAGE_URL + '" width=4 />');

                if (v || me.cellText) {
                    m.style += me.cstyle;
                    s += v ? v : me.cellText;
                }
                return s;
            }
        }
    }
}); 