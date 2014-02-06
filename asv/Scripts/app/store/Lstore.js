Ext.define('QB.Store.Lstore', {
    extend: 'Ext.data.Store',
    loaded: false,
    remoteFilter: true,
    pageSize: 50,    

    constructor: function (cfg) {
        var me = this,
            baseproxy = {
                listeners: {
                    exception: function (proxy, response) {                        
                        showStatus(response.status + ' ' + response.statusText);
                    }
                },
                reader: { root: 'data', type: 'json' },
                type: 'ajax'
            };
               
        cfg = cfg || {};
        cfg.proxy = cfg.proxy ? Ext.applyIf(cfg.proxy, baseproxy) : Ext.applyIf(me.proxy, baseproxy);

        me.callParent(arguments);
        (me.pageSize == 0) && (me.proxy.limitParam = me.proxy.pageParam = me.proxy.startParam = null);
        
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
        if (!me.loaded) {
            /*options = options || {};
            options.callback = function (recs, op, success) {
                try {
                    if (!success) throw op.error;

                    if (op.response) {
                        var obj = Ext.decode(op.response.responseText);
                        if (!obj.success) throw obj.message;
                    }
                }
                catch (e) {
                    me.fireEvent('exception', e, success);
                };
            };*/
            return me.callParent([options]);
        }
    },

    loadPage: function (page, options) {
        this.loaded = false;
        this.callParent(arguments);
    }
})