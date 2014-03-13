Ext.define('QB.store.Dbs', {
    extend: 'Ext.data.TreeStore',
    model: 'QB.model.Db',        
    autoLoad: false,
    defaultRootId: '',
    defaultRootProperty: 'data',
    nodeParam: '',    
    proxy: {
        timeout: connTimeout * 1000,
        type: 'ajax',
        url: '/main/getobjs'
    },
    root: { expanded: false },

    listeners: {
        beforeexpand: function (nd) {                         
            if (!nd.isRoot()){
                var me = this, nt = nd.get('nt'), drv = (nt == 1) ? nd.parentNode.get('drv') : nd.get('drv');

                me.proxy.extraParams.nt = nt;
                me.proxy.extraParams.drv = drv;
                me.proxy.extraParams.name = (nt == 1 && drv == 0) ? nd.get('od') : nd.get('name');

                (nt == 1) ? (me.proxy.extraParams.schema = nd.parentNode.get('name')) : delete me.proxy.extraParams['schema'];                
            }
            delete nd.data.iconCls;
        },        
        expand: function (nd) {
            nd.set('iconCls', null);
        }
    },

    clearFilter: function () {
        for (var p in this.proxy.extraParams)
            delete this.proxy.extraParams[p];
    },    

    load: function (options) {
        var me = this;
        //if (!me.loaded) 
            return me.callParent([options]);        
    }
})
