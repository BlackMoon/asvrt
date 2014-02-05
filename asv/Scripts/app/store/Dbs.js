Ext.define('QB.store.Dbs', {
    extend: 'Ext.data.TreeStore',
    model: 'QB.model.Db',    
    defaultRootId: '',
    defaultRootProperty: 'data',
    nodeParam: '',
    proxy: {        
        listeners: {
            exception: function (proxy, response) {                
                showStatus(response.status + ' ' + response.statusText);
            }
        },
        timeout: connTimeout * 1000,
        type: 'ajax',
        url: '/main/getobjs'
    },

    listeners: {
        beforeexpand: function (nd) {                         
            var me = this, nt = nd.get('nt'), drv = (nt == 1) ? nd.parentNode.get('drv') : nd.get('drv');

            me.proxy.extraParams.nt = nt;
            me.proxy.extraParams.drv = drv;
            me.proxy.extraParams.name = (nt == 1 && drv == 0) ? nd.get('od') : nd.get('name');

            (nt == 1) ? (me.proxy.extraParams.schema = nd.parentNode.get('name')) : delete me.proxy.extraParams['schema'];                
            delete nd.data.iconCls;
        },        
        expand: function (nd) {
            nd.set('iconCls', null);
        }
    },

    constructor: function () {
        this.addEvents('exception');
        this.callParent(arguments);
    },

    clearFilter: function () {
        for (var p in this.proxy.extraParams)
            delete this.proxy.extraParams[p];
    },

    read: function () {
        if (!this.loaded)
            return this.load.apply(this, arguments);
    },

    load: function (options) {
        var me = this;
        //if (!me.loaded) 
            return me.callParent([options]);        
    }
})
