class baseModel {
    constructor (pool){
        this.pool = pool
    }
    /**
     * 
     * @param {sql语句} sql 
     */
    query (sql) {

        return new Promise((resolve,reject)=>{
            this.pool.query(sql,function(err,result,fileds){
                if (err) reject(err);
                resolve(result,fileds)
            })
        })
        
    }

   
    async find ({queryStr,sortStr,page,limit,table,colum},debug) {

        let sql_header = `SELECT ${colum?colum:'*'} FROM ${table?table:this.table} `
        let sql_where = queryStr?`WHERE ${queryStr} `:''
        let sql_sort = sortStr?`ORDER BY ${sortStr} `:''
        let sql_page = ''
        if (limit&&page){
            sql_page = `limit ${(page-1)*limit},${limit}`
        }

        let sql = `${sql_header}${sql_where}${sql_sort}${sql_page}`
        if (debug==1){
            console.log(sql);
        }
        let result = await this.query(sql)
        return result;
    }

    async findOne () {
        let result = await this.find(...arguments)
        return result[0]
    }

    async update ({setStr,searchStr},debug) {
        let sql = `UPDATE ${this.table} SET ${setStr} ${searchStr?('WHERE '+searchStr):''}`
        debug==1&&console.log(sql);
        let reasult = await this.query(sql)
        return reasult;
    }

    async insert (data) {
        let valueList='';
        let columList='';
        if (!Array.isArray(data)){
            data = [data];
        }
        columList = Object.keys(data[0]).join(',')
        valueList = (data.map((val)=>{
            let tmpArr = []
            columList.split(',').forEach(key=>{
               typeof val[key]=='string'&&tmpArr.push(`"${val[key]}"`)
               typeof val[key]=='number'&&tmpArr.push(val[key])
            })
            return `(${tmpArr.join(',')})`
        })).join(',')

        let sql = `INSERT INTO ${this.table} (${columList}) VALUES ${valueList}`
        let result = await this.query(sql);
        return result;
    }

    async count () {
        arguments[0].colum="count(*) as count"
        let result = await this.find(...arguments)
        return (result[0]?result[0].count:null);
    }

    async delete ({queryStr}) {
        let sql = `DELETE FROM ${this.table} WHERE ${queryStr}`
        let result = await this.query(sql)
        return result
    }

    getSetStr (obj) {
        let tmpArr = []
        Object.keys(obj).forEach((key)=>{
            typeof obj[key]=='string'&&tmpArr.push(`${key}="${obj[key]}"`)
            typeof obj[key]=='number'&&tmpArr.push(`${key}=${obj[key]}`)
        })
        
        return tmpArr.join(',')
    }


}

module.exports = baseModel