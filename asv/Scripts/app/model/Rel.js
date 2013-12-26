Ext.define('QB.model.Rel', {
    extend: 'Ext.data.Model',
    fields: ['tab', 'od', 'schema', 'field', 'reftab', 'refod', 'refschema', 'reffield', 'needfield', 'needreffield'],
    validations: [{ type: 'presence', field: 'tab' }, { type: 'presence', field: 'field' }, { type: 'presence', field: 'reftab' }, { type: 'presence', field: 'reffield' }]    
});