Ext.define('QB.model.User', {
	extend: 'Ext.data.Model',
	fields: ['id', 'login', 'lastname', 'firstname', 'middlename', 'isapproved', 'isadmin']
});