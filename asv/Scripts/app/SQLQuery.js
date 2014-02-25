Ext.define('QB.SQLQuery', {
    avX: 20,
    avY: 10,
    loaded: true, 
    
    constructor: function (conn, panel) {
        var me = this;
        me.conn = conn;
        me.panel = panel;
        me.userdefined = 0;

        me.aliases = [];            // алиасы таблиц (дубликатов) 
        me.indexes = [];            // индексы таблиц
        me.params = [];
        me.relations = [];          // связи таблиц (пользовательские)
        me.uparams = [];
        me.udparams = [];           // userdefined params (userdefined = true)
        me.tables = [];

        me.updateLabel();
    },

    addParam: function (name) {
        var i = 0, name = name.toLowerCase();

        if (name != '*') {
            var me = this, alias;

            me.aliases.forEach(function (a) {
                if (a.name == name) {
                    alias = a;
                    return true;
                }
            })

            if (alias) {
                alias.cnt++;
                i = me.getAvailableIx();                
            }
            else {
                me.aliases.push({ name: name, cnt: 1 });
                me.indexes.push(0);
            }
        }

        return i;
    },

    addTable: function (name, table) {
        this.tables.push({ name: name, ix: 0, table: table });        
    },
  
    calculateAvailableXY: function () {        
        var me = this, available,            
            x = 30, y = 10; 

        do {
            available = true;

            me.tables.forEach(function (t) {
                var tb = t.table;
                if (tb.inWindow(x, y) || tb.inWindow(x + 260, y) || tb.inWindow(x, y + 160) || tb.inWindow(x + 260, y + 160)) {                    
                    available = false;
                    return true;
                }
            })

            if (available) {
                me.avX = x;
                me.avY = y;
            }
            else {
                x += 290;
                // next row
                if (x > me.panel.getWidth() - 20) {
                    x = 30;
                    y += 170;
                }
            }
        }
        while (!available)   
    },

    deleteParam: function (name, ax) {
        var me = this, alias, i, name = name.toLowerCase(), needRemove = false;

        i = me.indexes.indexOf(ax);
        (i != -1) && (me.indexes.splice(i, 1));

        for (i = 0; i < me.aliases.length; ++i) {
            if (me.aliases[i].name == name) {
                alias = me.aliases[i];                
                needRemove = (--alias.cnt == 0);
                break;
            }
        }

        (needRemove) && me.aliases.splice(i, 1);
    },

    deleteTable: function(name) {
        var me = this, i, ix = -1;

        for (i = 0; i < me.tables.length; ++i) {
            if (me.tables[i].name == name) {
                ix = i;
                break;
            }
        }

        if (ix >= -1) {
            var t = me.tables[ix];
            if (t.table.parent) {
                var px = t.table.parent.duplicates.indexOf(t.table.ix);
                t.table.parent.duplicates.splice(px, 1);
            }
            me.tables.splice(ix, 1);
        }

        // update relations
        i = 0;
        while (i < me.relations.length) {
            var r = me.relations[i];


            if (r.tab == name) {
                t = me.getTable(r.reftab);

                if (t) {
                    store = t.wnd.store;
                    ix = store.findBy(function (f) {
                        return (r.field == f.get('name') || r.reffield == f.get('name'));
                    })

                    if (ix != -1) {
                        rec = store.getAt(ix);
                        rec.set('joined', 0);
                        rec.commit();
                    }
                }

                me.relations.splice(i, 1);
            }
            else if (r.reftab == name) {
                t = me.getTable(r.tab);

                if (t) {
                    store = t.wnd.store;
                    ix = store.findBy(function (f) {
                        return (r.field == f.get('name') || r.reffield == f.get('name'));
                    })

                    if (ix != -1) {
                        rec = store.getAt(ix);
                        rec.set('joined', 0);
                        rec.commit();
                    }
                }

                me.relations.splice(i, 1);
            }
            else
                i++;
        }        
    },

    destroy: function () {
        var me = this;
        me.conn = null;
        me.panel = null;
        me.tables = [];        
    },

    generateParams: function () {
        var me = this;
            match = [],
            sql = me.panel.text.getValue();

        if (me.userdefined) 
            match = Ext.Array.unique(sql.match(/\?([A-Za-z0-9]+)|\@([A-Za-z0-9]+)/g) || []);

        return match;
    },

    getAvailableIx: function () {
        var me = this, ax, i = -1;         // check from 0 index
        
        do {
            ax = me.indexes.indexOf(++i);
        }
        while (ax != -1)
        me.indexes.push(i);

        return i;
    },

    getDuplicates: function (name) {
        var d = [];
        this.tables.forEach(function (t) {
            t.table.parent && (t.table.parent.name == name) && d.push(t.table.ix);            
        })
        return d;
    },

    getRefKeys: function (name) {
        var me = this, fks = [], p;        
        
        me.tables.forEach(function (t) {
            p = t.table.od || t.table.name;            

            if (p != name) {
                t.table.fkeys.forEach(function (k) {                   

                    if (k.refod == name || k.reftable == name) {
                        fks.push({ tab: t, fkey: k });
                    }
                })
            }

            me.relations.forEach(function (r) {
                if ((r.od == p || r.tab == p) && (r.refod == name || r.reftab == name)) 
                    fks.push({ tab: t, fkey: { name: 'FK_JOINED_' + r.field + '_' + r.reffield, cols: [r.field], reftable: r.reftab, refcols: [r.reffield], refschema: r.refschema } });

                if ((r.refod == p || r.reftab == p) && (r.od == name || r.tab == name))
                    fks.push({ tab: t, fkey: { name: 'FK_JOINED_' + r.reffield + '_' + r.field, cols: [r.reffield], reftable: r.tab, refcols: [r.field], refschema: r.schema } });
            })
        })        

        return fks;
    },

    getTable: function(name, od){                
        var p, t = Ext.Array.findBy(this.tables, function (t) {
            p = t.name;
            (od) && (p = t.table.od);
            return (p == name);
        })

        if (t)
            return t.table;
    },    

    joinFunc: function (t, fk, dupl) {
        var me = this, alias = '', conds = [],
            name = t.table.name,
            refname = fk.refname || fk.reftable, 
            short, tab;

        (t.table.schema) && (name = t.table.schema + '.' + name);
        (fk.refschema) && (refname = fk.refschema + '.' + refname);

        switch (me.conn.drv) {
            case 0:
                var ix = name.lastIndexOf('.'),             // parent index                
                    ix1 = refname.lastIndexOf('.'),
                    short1 = refname.substr(++ix1);
                
                short = t.name.substr(++ix);                // parent short name                

                (dupl) && (alias = ' ' + short);
                tab = (!dupl) ? short1 : short;        

                break;
            case 1:
                (dupl) && (alias = ' ' + t.name);
                tab = (!dupl) ? refname : t.name;

                break;
        }
        
        var i = 0;
        for (; i < fk.cols.length; ++i) {
            switch (me.conn.drv) {                
                case 0:
                    conds.push(tab + '.' + fk.refcols[i] + ' = ' + short + '.' + fk.cols[i]);                    
                    break;
                case 1:                    
                    conds.push(tab + '.' + fk.refcols[i] + ' = ' + name + '.' + fk.cols[i]);
                    break;
            }            
        }        

        return refname + alias + ' ON ' + conds.join(' AND ');
    },

    // сортировка join (рекурсивная)
    joinOrder: function (tables, joins) {
        var me = this, items = [];

        tables.forEach(function (t) {            
            var i = 0, j, idx = [], tabs = [],            
                item = { tab: t, sql: [] };

            while (i < joins.length) {
                j = joins[i];
                if (j.tab == t) {                    
                    item.sql.push(j.join);

                    joins.splice(i, 1);
                    tabs.push(j.ref);
                }
                else 
                    i++;
            }

            if (tabs.length > 0) {
                item.tab = t;
                item.refs = me.joinOrder(tabs, joins);
                items.push(item);
            }
        })

        return items;
    },

    joinSQL: function (joins, item) {
        var me = this;

        item.sql.forEach(function (s) {
            joins.push(s);
        })        

        item.refs.forEach(function (r) {
            me.joinSQL(joins, r);
        })
    },

    quotFunc: function (v, ft) {
        var me = this;
        if (ft == 1 || ft == 3) {

            var parts = v.split(',');
            parts.forEach(function (p, ix) {
                p = p.trimLeft();
                (p[0] != '\'') && (p = '\'' + p);
                (p.length == 1 || p[p.length - 1] != '\'') && (p = p + '\'');                

                (ft == 1 && me.conn.drv == 0) && (p = 'TO_DATE(' + p + ', \'DD.MM.YYYY\')');
                parts[ix] = p;
            });
            v = parts.join(', ');            
        }
        return v;
    },

    parseSQL: function(){
    },

    updateLabel: function () {
        var me = this, txt = me.panel.schema;
        (me.conn) && txt.setText(me.conn.name);
    },

    updateRelLabels: function () {
        var me = this, ix, rec, store, t;

        me.relations.forEach(function (r) {
            //tab
            t = me.getTable(r.tab);

            if (t){
                store = t.wnd.store;
                ix = store.findBy(function (f) {
                    return (r.field == f.get('name') || r.reffield == f.get('name'));
                })

                if (ix != -1) {
                    rec = store.getAt(ix);
                    rec.set('joined', 1);
                    rec.commit();
                }
            }

            //reftab
            t = me.getTable(r.reftab);

            if (t) {
                store = t.wnd.store,
                ix = store.findBy(function (f) {
                    return (r.field == f.get('name') || r.reffield == f.get('name'));
                })

                if (ix != -1) {
                    rec = store.getAt(ix);
                    rec.set('joined', 1);
                    rec.commit();
                }
            }
        })       
    },

    updateSQL: function () {
        var me = this, clause, col, order, where, panel = me.panel;            
        
        if (me.userdefined) return;

        var columns = [], joins = [], groups = [], orders = [], tables = [], wheres = [];
        me.params = [];
        me.uparams = [];

        panel.paramsstore.each(function (r) {
            var field = r.get('field'),
                formula = r.get('formula'),
                alias = r.get('alias'),
                aggr = r.get('aggr'),
                ord = r.get('ord'),
                oper = r.get('oper'),
                oper1 = r.get('oper1'),
                userp = r.get('userp'),
                userp1 = r.get('userp1'),
                f = userp ? '?' : r.get('def'),
                f1 = userp1 ? '?' : r.get('def1'),
                f2 = r.get('filter2'),
                ft = r.get('ft'),
                schema = r.get('schema'),
                tbl = r.get('tbl'),
                tabix = r.get('tabix');
                        
            where = '';

            switch (me.conn.drv) {
                case 0: 
                    var ix = tbl.lastIndexOf('.'),
                        short = tbl.substr(++ix);

                    clause = col = order = short + '.' + field; 

                    if (new RegExp('sum', 'i').exec(field)) {
                        clause = col = order = short + '."' + field + '"';                        
                        order = '"' + field + '"';
                    } 

                    break;
                case 1:
                    col = tbl + '.' + field

                    if (!tabix && schema) 
                        col = schema + '.' + col;
                    
                    clause = order = col;
                    (ft == 1) && (clause = 'TRUNC(' + clause + ')');                    

                    break;
            }

            if (field)
                (field != '*') && (col = formula.replace(new RegExp('\\b' + field + '\\b', 'gi'), col));            
            else
                col = formula;

            // where
            if (oper) {                

                if (!userp) {
                    (ft == 1 && Ext.isDate(f)) && (f = Ext.Date.format(f, 'd.m.Y'));
                    // oper < 8 - унарные операции
                    if (oper < 8) {
                        switch (ft) {                            
                            case 0:
                                f = f || 0;
                                break;
                            case 1:
                                f = '\'' + f + '\'';
                                (me.conn.drv == 0) && (f = 'TO_DATE(' + f + ', \'DD.MM.YYYY\')');
                                break;
                            case 3:
                                f = '\'' + f + '\'';
                                break;
                        }
                    }
                }
                else {
                    (ft == 1 && oper < 8 && me.conn.drv == 0) && (f = 'TO_DATE(' + f + ', \'DD.MM.YYYY\')');
                }   

                if (wheres.length > 0)
                    where += r.get('uor') ? ' OR ' : ' AND ';                                

                where += clause + ' ';
                switch (oper) {
                    case 1:                
                        where += '= ' + f;
                        break;
                    case 2:
                        where += '!= ' + f;
                        break;
                    case 3:
                        where += '> ' + f;
                        break;
                    case 4:
                        where += '< ' + f;
                        break;
                    case 5:
                        where += 'IS NOT NULL';
                        userp = false;
                        break;
                    case 6:
                        where += 'IS NULL';
                        userp = false;
                        break;
                    case 7:
                        where += 'BETWEEN ' + f;
                        break;
                    case 8:
                        (!userp) && (f = '\'%' + f + '%\'');
                        where += 'LIKE ' + f;
                        break;
                    case 9:
                        (!userp) && (f = '\'' + f + '%\'');
                        where += 'LIKE ' + f;
                        break;
                    case 10:
                        (!userp) && (f = me.quotFunc(f, ft));
                        where += 'IN (' + f + ')';
                        break;
                    case 11:
                        (!userp) && (f = me.quotFunc(f, ft));
                        where += 'NOT IN (' + f + ')';
                        break;
                }
                userp && me.uparams.push({ ft: ft, oper: oper, descr: r.get('descr'), def: r.get('def'), field: r.get('tbl') + '.' + r.get('field') });
            }

            if (oper1) {
                if (!userp1) {
                    (ft == 1 && Ext.isDate(f1)) && (f1 = Ext.Date.format(f1, 'd.m.Y'));
                    // oper1 < 8 - унарные операции
                    if (oper1 < 8) {
                        switch (ft) {
                            case 0:
                                f1 = f1 || 0;
                                break;
                            case 1:
                                f1 = '\'' + f1 + '\'';
                                (me.conn.drv == 0) && (f1 = 'TO_DATE(' + f1 + ', \'DD.MM.YYYY\')');
                                break;
                            case 3:
                                f1 = '\'' + f1 + '\'';
                                break;
                        }
                    }
                }
                else {
                    (ft == 1 && oper1 < 8 && me.conn.drv == 0) && (f1 = 'TO_DATE(' + f1 + ', \'DD.MM.YYYY\')');
                }

                if (oper1 == 7)
                    where += ' AND ' + f1;
                else {

                    (where || wheres.length > 0) && (where += r.get('uor1') ? ' OR ' : ' AND ');                    

                    where += clause + ' ';
                    switch (oper1) {
                        case 1:
                            where += '= ' + f1;
                            break;
                        case 2:
                            where += '!= ' + f1;
                            break;
                        case 3:
                            where += '> ' + f1;
                            break;
                        case 4:
                            where += '< ' + f1;
                            break;
                        case 5:
                            where += 'IS NOT NULL';
                            userp1 = false;
                            break;
                        case 6:
                            where += 'IS NULL';
                            userp1 = false;
                            break;
                        case 8:
                            (!userp1) && (f1 = '\'%' + f1 + '%\'');
                            where += 'LIKE ' + f1;
                            break;
                        case 9:                            
                            (!userp1) && (f1 = '\'' + f1 + '%\'');
                            where += 'LIKE ' + f1;
                            break;
                        case 10:
                            (!userp1) && (f1 = me.quotFunc(f1, ft));
                            where += 'IN (' + f1 + ')';
                            break;
                        case 11:
                            (!userp1) && (f1 = me.quotFunc(f1, ft));
                            where += 'NOT IN (' + f1 + ')';
                            break;
                    }
                }
                userp1 && me.uparams.push({ ft: ft, oper: oper1, descr: r.get('descr1'), def: r.get('def1') });
            }

            if (f2) {
                (where || wheres.length > 0) && (where += r.get('uor2') ? ' OR ' : ' AND ');                
                where += clause + ' ' + f2;
            }            

            (where) && (wheres.push(where));            

            // group by
            (aggr == 3) && groups.push(order);            

            // order
            if (ord) {                
                (ord == 2) && (order += ' DESC');                
                orders.push(order);
            }

            if (r.get('out')) {                                    
                var param = { name: field, table: tbl };

                switch (aggr) {
                    case 1:
                        col = 'avg(' + col + ')';
                        break;
                    case 2:
                        col = 'count(' + col + ')';
                        break;
                    case 4:
                        col = 'max(' + col + ')';
                        break;
                    case 5:
                        col = 'min(' + col + ')';
                        break;
                    case 6:
                        col = 'sum(' + col + ')';
                        break;                    
                }

                if (alias) {                    
                    col += ' "' + alias + '"';
                    param.name = alias;
                }                

                columns.push(col);
                me.params.push(param);
            }
        });

        panel.funcsstore.each(function (f) {
            var alias = f.get('alias'),
                body = f.get('body'),
                def = f.get('def');

            where = '';

            if (f.get('fnid')) {
                var uargs = f.get('args');

                if (uargs) {
                    uargs.split(/[,;]+/).forEach(function (a, ix) {
                        var re = '\\?' + ix + '|\@' + ix;
                        body = body.replace(new RegExp(re, 'g'), a); 
                    })
                }
            }

            if (f.get('out')) {
                col = body;

                switch (f.get('outaggr')) {
                    case 1:
                        col = 'avg(' + col + ')';
                        break;
                    case 2:
                        col = 'count(' + col + ')';
                        break;
                    case 4:
                        col = 'max(' + col + ')';
                        break;
                    case 5:
                        col = 'min(' + col + ')';
                        break;
                    case 6:
                        col = 'sum(' + col + ')';
                        break;
                }

                (alias) && (col += ' "' + alias + '"');
                columns.push(col);
            }

            if (f.get('filter')) {
                clause = body;

                if (wheres.length > 0)
                    where += f.get('uor') ? ' OR ' : ' AND ';

                switch (f.get('filteraggr')) {
                    case 1:
                        clause = 'avg(' + clause + ')';
                        break;
                    case 2:
                        clause = 'count(' + clause + ')';
                        break;
                    case 4:
                        clause = 'max(' + clause + ')';
                        break;
                    case 5:
                        clause = 'min(' + clause + ')';
                        break;
                    case 6:
                        clause = 'sum(' + clause + ')';
                        break;
                }

                where += clause + ' ';

                switch (f.get('oper')) {
                    case 1:
                        where += '= ' + def;
                        break;
                    case 2:
                        where += '!= ' + def;
                        break;
                    case 3:
                        where += '> ' + def;
                        break;
                    case 4:
                        where += '< ' + def;
                        break;
                    case 5:
                        where += 'IS NOT NULL';
                        break;
                    case 6:
                        where += 'IS NULL';
                        break;
                }
                wheres.push(where);
            }

            if (f.get('ord')) {
                order = body;

                switch (f.get('ordaggr')) {
                    case 1:
                        order = 'avg(' + order + ')';
                        break;
                    case 2:
                        order = 'count(' + order + ')';
                        break;
                    case 4:
                        order = 'max(' + order + ')';
                        break;
                    case 5:
                        order = 'min(' + order + ')';
                        break;
                    case 6:
                        order = 'sum(' + order + ')';
                        break;
                }

                (f.get('dir') == 2) && (order += ' DESC');
                orders.push(order);
            }
        });

        var hash, hashes = [], tmp = [];
        me.tables.forEach(function (t) {           
            var tab = t.table,
                pks = tab.pks, 
                name = (tab.schema) ? tab.schema + '.' + tab.name : tab.name;                

            if (tab.ix === 0) {
                var keys = me.getRefKeys(tab.od || tab.name);
                if (keys.length > 0) {
                    var prev;

                    keys.forEach(function (k) {
                        k.fkey.refname = tab.name;
                        if (tab.name != prev) {
                            hash = tab.name + k.tab.table.name;

                            if (hashes.indexOf(hash) == -1) {

                                hashes.push(hash);
                                hashes.push(k.tab.table.name + tab.name);
                                tmp.push({ ref: name, tab: (k.tab.table.schema) ? k.tab.table.schema + '.' + k.tab.table.name : k.tab.table.name, join: me.joinFunc(k.tab, k.fkey) });
                            }
                            else {
                                (tables.indexOf(name) == -1) && tables.push(name);
                            }
                        }                       

                        prev = tab.name;
                    })
                }
                else {
                    (tables.indexOf(name) == -1) && tables.push(name);
                }
            }
            // duplicate
            else {
                // primary keys
                (pks.length) ? joins.unshift(me.joinFunc(t, { cols: pks, refcols: pks, reftable: t.table.name }, 1)) : tables.unshift(name);
            }           
        });
        hashes = [];

        var items = me.joinOrder(tables, tmp);
        items.forEach(function (t) {
            me.joinSQL(joins, t);
        })

        me.sql = 'SELECT\t\t';
        me.sql += columns.join(', ');
        me.sql += '\nFROM\t\t';
        (!Ext.isIE) && (me.sql += '\t');
        
        if (tables.length > 0) {
            me.sql += tables[0];
            (tables.length > 1) && (me.sql += '\nCROSS JOIN\t' + tables.slice(1).join('\nCROSS JOIN\t'));
        }

        var sep = '\nJOIN\t\t';
        (!Ext.isIE) && (sep += '\t');
        (me.useleftjoin) && (sep = '\nLEFT JOIN\t\t');        

        (joins.length > 0) && (me.sql += sep + joins.join(sep));
        (wheres.length > 0) && (me.sql += '\nWHERE\t\t' + wheres.join(''));
        (groups.length > 0) && (me.sql += '\nGROUP BY\t\t' + groups.join(', '));
        (orders.length > 0) && (me.sql += '\nORDER BY\t\t' + orders.join(', '));        

        (me.conn.drv == 1) && (me.sql += ';');

        panel.text.setValue(me.sql);
    }
})
    