/* *************************************************************
* Делегаты, связывающие коллекции хранимых объектов (relators)
* ************************************************************** */
using System.Collections.Generic;

namespace asv.Models
{
    // Псевдоним -> Поля
    class AliasRelator
    {
        private Alias prev;
        public Alias Map(Alias a, Alias f)
        {
            if (a != null)
            {
                if (prev != null && prev.Id.Equals(a.Id))
                {
                    if (f.Id != 0)
                        prev.Fields.Add(f);

                    return null;
                }

                prev = a;

                if (f.Id != 0)
                {
                    prev.Fields = new List<Alias>();
                    prev.Fields.Add(f);
                }
            }

            return a;
        }
    }

    // Каталог -> Разделы
    class CatalogRelator
    {
        private Catalog prev;
        public Catalog Map(Catalog c, Node n)
        {
            if (c != null)
            {
                if (prev != null && prev.Id.Equals(c.Id))
                {
                    if (n.Id != 0)
                        prev.Nodes.Add(n);

                    return null;
                }

                prev = c;

                if (n.Id != 0)
                {
                    prev.Nodes = new List<Node>();
                    prev.Nodes.Add(n);
                }
            }

            return c;
        }
    }

    // Функция -> Параметры
    class FuncRelator
    {
        private Func prev;
        public Func Map(Func f, FParam p)
        {
            if (f != null)
            {
                if (prev != null && prev.Id.Equals(f.Id))
                {
                    if (p.Id != 0)
                        prev.Params.Add(p);

                    return null;
                }

                prev = f;

                if (p.Id != 0)
                {
                    prev.Params = new List<FParam>();
                    prev.Params.Add(p);
                }
            }

            return f;
        }
    }

    // Запрос -> Таблицы
    class QueryRelator
    {
        private Query prev;
        public Query Map(Query q, Param p)
        {
            if (q != null)
            {
                if (prev != null && prev.Id.Equals(q.Id))
                {
                    if (p.Id != 0)
                        prev.Params.Add(p);

                    return null;
                }                

                prev = q;

                if (p.Id != 0)
                {
                    prev.Params = new List<Param>();
                    prev.Params.Add(p);
                }
            }

            return q;
        }
    }

    // Пользователь -> Базы
    class PersonRelator
    {
        private Person prev;
        public Person Map(Person p, Userdb b)
        {
            if (p != null)
            {
                if (prev != null && prev.Id.Equals(p.Id))
                {
                    if (p.Id != 0)
                        prev.Bases.Add(b);

                    return null;
                }

                prev = p;
                if (p.Id != 0)
                {
                    prev.Bases = new List<Userdb>();
                    prev.Bases.Add(b);
                }
            }
            return p;
        }
    }
}