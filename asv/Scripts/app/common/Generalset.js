Ext.define('QB.common.Generalset', {
    extend: 'Ext.form.FieldSet',
    xtype: 'generalset',
    cls: 'general',
    defaults: { xtype: 'fieldcontainer', anchor: '100%', flex: 1 },
    layout: 'hbox',
    margin: '5',
    items: [{            
        margin: '0 10 0 0',
        defaults: { xtype: 'displayfield', fieldStyle: 'color: blue' },
        items: [{            
            name: 'author',
            fieldLabel: 'Автор'                
        },
        {            
            name: 'datecreate',
            fieldLabel: 'Дата создания'                
        }]
    },
    {
        defaults: { xtype: 'displayfield', fieldStyle: 'color: blue' },
        items: [{            
            name: 'editor',
            fieldLabel: 'Редактор'                
        },
        {            
            name: 'dateedit',
            fieldLabel: 'Дата изменения'
        }]
    }],

    setValues: function (values) {
        var me = this;

        Ext.suspendLayouts();
        me.query('displayfield').forEach(function (field) {            
            field.setValue(values[field.name]);
        })
        
        Ext.resumeLayouts(true);
        return me;
    }
})