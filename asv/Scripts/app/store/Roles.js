﻿Ext.define('QB.store.Roles', {
    extend: 'QB.store.Lstore',
    model: 'QB.model.Role',
    actives: [],

    proxy: {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
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
                return (a == rec.get('authority'));
            })

            rec.set('active', a ? 1 : 0);
            rec.commit();
        });
    }
});