Ext.define('QB.store.Roles', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Role',
    actives: [],

    proxy: {        
        url: '/roles.xml',        
        reader: {
            type: 'xml',
            record: 'role'            
        }
    },

    constructor: function (cfg) {
        var me = this;
        me.callParent(arguments);

        me.on({
            load: function () {
                me.setActives();
                return true;
            }
        })
    },

    setActives: function () {
        var me = this;

        me.each(function (rec) {
            var a = Ext.Array.findBy(me.actives, function (a) {
                return (a.id == rec.get('id'));
            })

            rec.set('active', a ? 1 : 0);
            rec.commit();
        });
    }
});