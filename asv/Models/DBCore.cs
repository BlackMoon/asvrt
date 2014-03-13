/* *************************************************************
* Базовые классы хранимых объектов
* ************************************************************** */
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using PetaPoco;
using System.Text.RegularExpressions;
using System;

namespace asv.Models
{
    // Тип поля БД
    public enum eFieldType
    {
        FieldBool,
        FieldDateTime,
        FieldNumeric,
        FieldString
    }

    // Тип БД
    public enum eDriverType
    {
        DriverCaché,
        DriverDB2
    }

    // Тип узла дерева-обозревателя
    public enum eNodeType
    {
        NodeScheme,
        NodeTable,
        NodeField,
        NodeFolder,
        NodeKey,
        NodePrimaryKey,
        NodeForeignKey
    }

    // Тип операции
    public enum eOperType
    {
        OperNone,               // нет
        OperEqual,              // равно
        OperNotEqual,           // не равно
        OperMore,               // больше
        OperLess,               // меньше
        OperNotNull,            // определено
        OperNull,               // не определено
        OperBetween,            // с .. по ..
        OperLike,               // содержит
        OperStarts,             // начинается
        OperIn                  // в списке        
    }

    // Тип агрегатной фкц
    public enum eAggrType
    {
        AggrNone,
        AggrAvg,
        AggrCount,
        AggrGroupBy,
        AggrMax,
        AggrMin,
        AggrSum,
        AggrAvgDistinct,
        AggrCountDistinct,
        AggrMaxDistinct,
        AggrMinDistinct,
        AggrSumDistinct
    }

    // Тип сортировки
    public enum eSortType
    {
        SortNone,
        SortAsc,
        SortDesc        
    }

    interface IKey
    {
        int Id { get; set; }
    }

    #region Абстрактный ключ    
    public abstract class Key : IKey
    {           
        public int Id { get; set; }
    }
    #endregion  

    #region Абстрактное поле-имя
    public abstract class Base
    {
        public string Name { get; set; }
    }
    #endregion

    #region Абстрактное поле
    public abstract class Field : Base
    {        
        public int Leaf { get; set; }
        public eNodeType Nt { get; set; }

        public Field(object name, eNodeType nt)
        {
            Name = name.ToString();            
            Nt = nt;
        }
    }
    #endregion

    #region Поле таблицы
    public class TableField : Field
    {   
        public eFieldType Ft { get; set; }
        [JsonProperty("rem")]
        public string Remark { get; set; }                          // псевдоним-описание

        public TableField(object name, eNodeType nt) : base(name, nt)
        {            
        }
    }
    #endregion

    #region Внешний ключ
    public class ForeignKey : Field
    {
        [DefaultValue("")]
        public string RefOd { get; set; }                               // Caché object definition
        [DefaultValue("")]
        public string RefSchema { get; set; }                           // схема таблицы внешнего ключа DB2
        public string RefTable { get; set; }                            // таблица первичного ключа
        [JsonProperty("cols")]
        public List<string> Columns { get; set; }                       // столбцы ключа
        [JsonProperty("refcols")]
        public List<string> RefColumns { get; set; }                    // столбцы первичного ключа

        public ForeignKey(object name, object refTable, object columns, object refColumns) : base(name, eNodeType.NodeKey)
        {            
            RefTable = refTable.ToString();

            Regex rx = new Regex(@";|\s+"); 
            if (columns != null)
            {
                Columns = new List<string>();
                Columns.AddRange(rx.Split(columns.ToString()));
            }

            if (refColumns != null)
            {
                RefColumns = new List<string>();
                RefColumns.AddRange(rx.Split(refColumns.ToString()));
            }      
        }
    }
    #endregion

    #region Параметр функции
    [TableName("qb_fparams")]
    public class FParam : IKey
    {
        [JsonIgnore]
        public int Id { get; set; }
        public eFieldType Ft { get; set; }                          // тип данных параметра
        public string Descr { get; set; }                           // описание
    }
    #endregion

    #region Пользовательский параметр
    [TableName("qb_uparams")]
    [PrimaryKey("id")]
    public class UParam : FParam
    {
        public string Field { get; set; }
        public string Def { get; set; }                             // значение по умолчанию
    }
    #endregion 

    #region Параметр запроса
    [TableName("qb_params")]
    public class Param : UParam
    {        
        public int Out { get; set; }                
        public int Tabix { get; set; }                              // индекс таблицы-дубликата        
        public eAggrType Aggr { get; set; }        
        public eSortType Ord { get; set; }        
        public string Alias { get; set; }        
        public string Formula { get; set; }        
        public eOperType Oper { get; set; }                         // тип операции фильтра        
        public int Uor { get; set; }                                // использовать или
        public int Userp { get; set; }                              // пользовательский параметр                
        public eOperType Oper1 { get; set; }                        // тип операции фильтра1        
        public int Uor1 { get; set; }                               // использовать или
        public int Userp1 { get; set; }                             // пользовательский параметр
        public string Descr1 { get; set; }                          // описание фильтра1
        public string Def1 { get; set; }                            // значение по умолчанию
        public string Filter2 { get; set; }                         // фильтр 2        
        public int Uor2 { get; set; }                               // использовать или
        public string Schema { get; set; }                          // схема таблицы параметра (IBM DB2)
        public string Tbl { get; set; }                             // таблица параметра
    }
    #endregion

    #region Псевдоним таблицы
    [TableName("qb_aliases")]
    [PrimaryKey("id")]
    public class Alias : Key
    {
        public string Name { get; set;  }
        public string Remark { get; set; }
        [ResultColumn]
        public IList<Alias> Fields { get; set; }                     // псевдонимы полей        
    }
    #endregion

    #region Таблица БД
    [TableName("qb_tables")]
    [PrimaryKey("id")]
    public class Table : Base, IKey
    {
        [JsonIgnore]
        public int Id { get; set; }
        public int Collapsed { get; set; }
        public string Od { get; set; }                              // Caché object definition
        public string Schema { get; set; }                          // DB2 needs SELECT FROM 'schema'.'table'
        [JsonProperty("rem")]
        public string Remark { get; set; }                          // псевдоним-описание        
        [ResultColumn]
        public IList<Field> Fields { get; set; }
        [ResultColumn]
        public IList<ForeignKey> FKeys { get; set; }
    }
    #endregion

    #region Связь между таблицами (пользовательская)
    [TableName("qb_relations")]
    [PrimaryKey("id")]
    public class Relation : IKey
    {
        [JsonIgnore]
        public int Id { get; set; }
        public string Tab { get; set; }                             // таблица-источник
        public string Od { get; set; }                              // таблица-источник (Cache)
        public string Schema { get; set; }                          // схема таблицы-источника (IBM DB2)
        public string Field { get; set; }                           // поле таблицы-источника        
        public string RefTab { get; set; }                          // связанная таблица
        public string RefOd { get; set; }                           // связанная таблица (Cache)
        public string RefSchema { get; set; }                       // схема связанной таблицы (IBM DB2)
        public string RefField { get; set; }                        // поле связанной таблицы
    }
    #endregion
    
    #region Запрос
    [TableName("qb_queries")]
    [PrimaryKey("id")]
    public class Query : Base, IKey
    {   
        public int Id { get; set; }
        public int Db2Mode { get; set; }                                // Режим DB2 для Cache
        public int UseLeftJoin { get; set; }                            // Использовать LEFT JOIN
        public int UserDefined { get; set; }                            // Пользовательский        

        public string Conn { get; set; }

        [Column("grp")]
        public string Group { get; set; }
        [Column("subgrp")]
        public string Subgroup { get; set; }
        public string Sql { get; set; }
        [ResultColumn]
        public IList<UFunc> Funcs { get; set; }
        [ResultColumn]
        public IList<Param> Params { get; set; }
        [ResultColumn]
        public IList<UParam> UParams { get; set; }                      // Пользовательские параметры (UserDefined = 1)
        [ResultColumn]
        public IList<Relation> Relations { get; set; }
        [ResultColumn]
        public IList<Template> Reports { get; set; }
        [ResultColumn]
        public IList<Table> Tables { get; set; }        
    }
    #endregion

    #region Соединение
    [TableName("qb_connections")]
    [PrimaryKey("name")]
    public class Connection
    {
        [Ignore]
        public int Port { get; set; }        
        public int HideSys { get; set; }                              // не показывать таблицы вне разделов
        public eDriverType Driver { get; set; }        
        [JsonIgnore]
        public string Name { get; set; }        
        [Ignore]
        public string Database { get; set; }
        [Ignore]
        public string Schema { get; set; }
        [Ignore]
        public string Server { get; set; }
        [Ignore]
        public string Uid { get; set; }
        [Ignore]
        public string Pwd { get; set; }        
    }
    #endregion

    #region Функция (справочник)
    [TableName("qb_functions")]
    [PrimaryKey("id")]
    public class Func : Base, IKey
    {
        public int Id { get; set; }
        public string Body { get; set; }                            // тело функции
        [ResultColumn]
        public IList<FParam> Params { get; set; }
    }
    #endregion

    #region Пользовательская функция
    [TableName("qb_ufunctions")]
    [PrimaryKey("id")]
    public class UFunc : Base
    {
        public int FnId { get; set; }                               // id функции из справочника
        public int Filter { get; set; }
        public int Out { get; set; }        
        public int Ord { get; set; }
        public int Uor { get; set; }
        public eSortType Dir { get; set; }
        public eOperType Oper { get; set; }
        public string Alias { get; set; }
        public string Args { get; set; }                            // аргументы функции
        public string Body { get; set; }                            // тело функции
        public string Def { get; set; }                             
    }
    #endregion

    #region Шаблон отчета
    [TableName("qb_templates")]
    [PrimaryKey("id")]
    public class Template : Key
    {
        public string Name { get; set; }                // имя шаблона
        [Column("grp")]
        public string Group { get; set; }               // группа шаблона
        [Column("subgrp")]
        public string Subgroup { get; set; }            // группа шаблона
        public string Fname { get; set; }               // имя файла
        public int Sz { get; set; }
        public int Version { get; set; }
        public byte[] Data { get; set; }
    }
    #endregion
    
    #region Каталог
    /// <summary>
    /// node in tree panel
    /// </summary>
    [TableName("qb_nodes")]
    [PrimaryKey("id")]
    public class Node : Base, IKey
    {
        [JsonIgnore]
        public int Id { get; set; }
        public int Leaf { get; set; }
        public string Internalid { get; set; }
        public string Parentid { get; set; }
        public string Od { get; set; }
        public string Rem { get; set; }
        public string Schema { get; set; }
        [JsonProperty("data")]
        [ResultColumn]
        public IList<Node> Children { get; set; }                        
    }

    [TableName("qb_catalogs")]
    [PrimaryKey("id")]
    public class Catalog : Base, IKey
    {
        public int Id { get; set; }
        public string Conn { get; set; }
        [ResultColumn]
        public List<Node> Nodes { get; set; }                        // узлы дерева каталога - разделы   
    }
    #endregion

    public class Pair<T1, T2>
    {
        public T1 Key { get; set; }        
        public T2 Value { get; set; }
    }

    [TableName("qb_bases")]
    public class Userdb
    {
        public int Auth { get; set; }
        public string Conn { get; set; }
    }

    #region Пользователь
    [TableName("qb_users")]
    [PrimaryKey("id")]
    public class Person : Key
    {
        public int IsAdmin { get; set; }
        public int IsApproved { get; set; }
        public int ServerLogin { get; set; }

        [JsonConverter(typeof(asv.Helpers.TimeConverter))]
        public DateTime DateCreate { get; set; }
        public DateTime LastLoginDate { get; set; }

        [Required]
        public string Login { get; set; }
        public string Password { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        public string FirstName { get; set; }
        
        [DefaultValue("")]
        public string MiddleName { get; set; }

        public string Comment { get; set; }

        [DefaultValue("")]
        public string Theme { get; set; }

        [ResultColumn]
        public List<Userdb> Bases { get; set; }

        [ResultColumn]
        public List<string> Roles { get; set; }
    }
    #endregion

    #region Журнал
    public class LogModel
    {
        public string Event { get; set; }
    }
    #endregion
}