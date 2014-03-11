Ext.define('QB.common.Spacenumcolumn', {
    extend: 'Ext.grid.NumberColumn',
    alias: ['widget.spacenumcolumn'],
    requires: ['Ext.util.Format'],
    align: 'right',
    format: '0,000.00',    
    suffix: '',    

    constructor: function (cfg) {
        var me = this;
        me.callParent(arguments);
        me.renderer = me.spacenumRenderer(me.format, me.suffix);    
    },

    spacenumRenderer: function (format, suffix) {
        return function (v, m) {            
            return Ext.util.Format.number(v, format).replace(/,/g, ' ') + suffix;
        };
    }
}); 