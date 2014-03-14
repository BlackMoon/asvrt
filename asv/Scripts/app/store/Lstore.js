Ext.define('QB.store.Lstore', {
    extend: 'Ext.data.Store',
    loaded: false,
    remoteFilter: true,
    pageSize: 50,    

    constructor: function (cfg) {
        var me = this, obj = {},
            baseproxy = {
                headers: { accept: 'application/json' },
                reader: { root: 'data', type: 'json' },
                type: 'ajax'
            };
        
        cfg = cfg || {};
        cfg.proxy = cfg.proxy ? Ext.applyIf(cfg.proxy, baseproxy) : Ext.applyIf(me.proxy, baseproxy);
        
        me.callParent(arguments);
        
        me.on({
            load: function () {
                me.loaded = true;
            }
        })
    },

    clearFilter: function () {
        this.doFilter();
        this.callParent(arguments);
    },

    doFilter: function () {
        this.currentPage = 1;
        this.loaded = false;
    },

    filter: function () {
        this.doFilter();
        this.callParent(arguments);
    },

    load: function (options) {
        var me = this;
        if (!me.loaded)             
            return me.callParent([options]);        
    },

    loadPage: function (page, options) {
        this.loaded = false;
        this.callParent(arguments);
    }
})