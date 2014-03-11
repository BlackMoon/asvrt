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
/*                
        Ext.apply(obj, { type: 'ajax', reader: { root: 'data', type: 'json' } }, me.proxy);        
        if (cfg.proxy) {
            (cfg.proxy.actionMethods) && (obj.actionMethods = cfg.proxy.actionMethods);
            (cfg.proxy.extraParams) && (obj.extraParams = cfg.proxy.extraParams);                        
            (cfg.proxy.reader) && Ext.apply(obj.reader, cfg.proxy.reader);
            (cfg.proxy.timeout) && (obj.timeout = cfg.proxy.timeout);
            (cfg.proxy.url) && (obj.url = cfg.proxy.url);
        }
        
        cfg.proxy = obj;*/
        
        cfg = cfg || {};
        cfg.proxy = cfg.proxy ? Ext.applyIf(cfg.proxy, baseproxy) : Ext.applyIf(me.proxy, baseproxy);
        me.callParent(arguments);

        //(me.pageSize == 0) && (me.proxy.limitParam = me.proxy.pageParam = me.proxy.startParam = null);
        
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