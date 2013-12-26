﻿Ext.define('QB.model.Db', {
    extend: 'Ext.data.Model',
    fields: ['od', 'name', { name: 'drv', type: 'int' }, { name: 'nt', type: 'int' }, 'schema', 'reftable', 'cols', 'refcols',
        {
            name: 'iconCls',
            type: 'string',
            convert: function (v, r) {
                switch (r.get('nt')) {
                    case 0:
                        return 'icon-db';
                        break;
                    case 1:
                        return 'icon-table';
                        break;
                    case 2:
                        return 'icon-field';
                        break;                    
                    case 4:
                        return 'icon-key';
                        break;
                    case 5:
                        return 'icon-pkey';
                        break;
                }
            }
        },
        {
            name: 'loaded',
            type: 'boolean',
            convert: function (v, r) {
                    return (r.get('nt') == 3);
            }            
        }]
});