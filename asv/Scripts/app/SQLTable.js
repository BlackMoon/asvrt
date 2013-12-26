Ext.define('QB.SQLTable', {        
    offX: 20,
    offY: 5,

    availableIdx: function () {
        var me = this, i = 0, ix;
        
        do {            
            ix = me.duplicates.indexOf(++i);
        }
        while(ix != -1)

        return i;
    },

    constructor: function (od, name, schema, conn, checks, wnd) {
        var me = this;
        me.od = od;                       // od - object definition in Cache
        me.name = name;
        me.schema = schema;
        me.conn = conn;
        me.wnd = wnd;

        me.checks = checks || [];
        me.duplicates = [];
        me.pks = [];
    },

    inWindow: function (x, y) {
        var me = this, wnd = me.wnd;
        return (x >= wnd.x - me.offX && x <= wnd.x + wnd.getWidth() + me.offX && y >= wnd.y - me.offY && y <= wnd.y + wnd.getHeight() - me.offY);
    }
})
