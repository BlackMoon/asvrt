Ext.define('QB.view.report.List', {
    extend: 'QB.common.Updwnd',
    requires: ['QB.common.Bargrid', 'QB.common.Updwnd'],
    alias: 'widget.reportlist',
    title: 'Шаблоны',
    btnSave: false,
    height: 320,
    width: 440,

    initComponent: function () {
        var me = this;

        me.items = [me.grid = Ext.widget('bargrid',
        {
            tbarConfig: { enable: false },
            selType: 'checkboxmodel',            
            store: 'Templates',
            columns: [ { text: 'Наименование', dataIndex: 'name', flex: 3 },
                       { text: 'Файл', dataIndex: 'fname', flex: 2 } ]
        })];
        
        me.buttons = [{ text: 'Выбрать', iconCls: 'icon-save', action: 'add' }];
        me.callParent(arguments);
    },

    selectTpl: function (reps) {
        var grid = this.grid,
            sm = grid.getSelectionModel();

        grid.store.each(function (r, ix) {
            (reps.indexOf(r.get('id')) != -1) && (sm.select(r, true));
        })        
    }
})