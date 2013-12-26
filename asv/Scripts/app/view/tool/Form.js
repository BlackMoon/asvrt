Ext.define('QB.view.tool.Form', {
    extend: 'Ext.form.Panel',
    alias: 'widget.toolform',    
    width: 480,    

    items: [{
        xtype: 'fieldset', 
        margin: '5',
        title: 'Запрос',
        defaults: { labelWidth: 150 },
        items: [{
            xtype: 'numberfield',
            name: 'itemsperpage',
            fieldLabel: 'Записей на странице',
            hideTrigger: true,
            value: 50            
        },
        {
            xtype: 'checkboxfield',
            name: 'leftjoin',
            fieldLabel: 'Использовать LEFT JOIN'
        }]
    }]    
});