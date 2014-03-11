Ext.define('QB.common.Stylecolumn', {
    extend: 'Ext.grid.Column',
    alias: 'widget.stylecolumn',
    cellText: '',
    cstyle: '',    

    constructor: function (cfg) {
        var me = this;        
        me.callParent(arguments);
        me.renderer = function (v, m) {
            if (v || me.cellText) {
                m.style += me.cstyle;
                return v ? v : me.cellText;
            }
        }
    }    
}); 