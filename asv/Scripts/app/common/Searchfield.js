Ext.define('QB.common.Searchfield', {
    extend: 'Ext.form.field.Trigger',
    alias: 'widget.searchfield',
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    trigger2Cls: Ext.baseCSSPrefix + 'form-search-trigger',
    hasSearch: false,
    paramName: 'query',
    minChars: 3,

    initComponent: function () {
        var me = this;

        me.callParent(arguments);
        me.on('specialkey', function (f, e) {
            (e.getKey() == e.ENTER) && me.onTrigger2Click();
        });

        me.bindStore();
    },

    afterRender: function () {
        this.callParent();
        this.triggerCell.item(0).setDisplayed(false);
    },

    bindStore: function () {
        var me = this;
        if (me.store) {
            if (!me.store.proxy.hasOwnProperty('filterParam'))
                me.store.proxy.filterParam = me.paramName;

            me.store.proxy.encodeFilters = function (filters) {
                return filters[0].value;
            }
        }
    },

    onTrigger1Click: function () {
        var me = this;

        if (me.hasSearch) {
            me.setValue('');
            me.store.clearFilter();
            me.hasSearch = false;
            me.triggerCell.item(0).setDisplayed(false);
            me.updateLayout();
        }
    },

    onTrigger2Click: function () {
        var me = this,
            store = me.store,
            proxy = store.getProxy(),
            value = me.getValue();

        if (value.length >= me.minChars) {
            me.store[me.store.remoteFilter ? 'filter' : 'filterFn']({ id: me.paramName, property: me.paramName, value: value });
            me.hasSearch = true;
            me.triggerCell.item(0).setDisplayed(true);
            me.updateLayout();
        }
        else if (value.length < 1) {
            me.onTrigger1Click();
            return;
        }
    }
});