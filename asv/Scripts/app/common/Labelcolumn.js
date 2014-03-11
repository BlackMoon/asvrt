Ext.define('QB.common.Labelcolumn', {
    extend: 'Ext.grid.Column',
    alias: 'widget.labelcolumn',
    labels: [],

    constructor: function (cfg) {
        var me = this;
        me.callParent(arguments);        
        me.renderer = me.arrayRenderer(me.labels);        
    },

    arrayRenderer: function (labels) {
        return function (v) {
            return labels[v];
        }
    }
}); 