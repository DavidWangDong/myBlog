const baseModel = require('./baseModel')
class cataLogModel extends baseModel {
    constructor(pool) {
        super(pool)
        this.table="catalog"
    }

    async hasSameName (cataname){
        let queryStr = `name="${cataname}"`
        let result = await this.count({queryStr});
        return result;
    }


    // 增加分类
    async addCata (ctx) {
        let {uid,cataname} = ctx.request.body;
        let data = {
            name:cataname,
            author:uid
        }

        try {
            let res  = await this.hasSameName(cataname);
            if (res){
                
                return {
                    error:1,
                    message:'文集同名'
                };
            }
           
            let result = await this.insert(data);
            let id = result.insertId            
            return {data:{id,name:cataname},error:0,message:'文集添加成功'}
        }catch (err) {
            return  {
                error:1,
                message:'数据库错误'
            };
        }
    }

    // 删除分类
    async deleteCata (ctx) {
        
        let {cataId} = ctx.request.body
        let queryStr = `id=${cataId}`
        let result = await this.delete({queryStr});
        let answer={error:1,message:'删除出错'};
        
        result.affectedRows>=1&&(answer={error:0,message:'删除成功'})
        result.affectedRows==0&&(answer={error:1,message:'删除失败，文集不存在'})
        
        return answer;

    }

     // 编辑分类
     async updateCata (ctx) {
        let {cataId,newName} = ctx.request.body
        let setStr = `name="${newName}"`
        let searchStr = `id=${cataId}`
        let result = await this.update({setStr,searchStr})
        let answer = {error:1,message:'重命名出错'}
        
        result.affectedRows>=1&&(answer={error:0,message:'重命名成功'})
        result.affectedRows==0&&(answer={error:1,message:'重命名出错,文集不存在'})
        
        return answer
    }


    // 输出分类
    async getCatas (ctx){
        let {uid} = ctx.request.body
        let answer = {
            error:1,
            message:'数据库错误,请稍后重试',
        };
        try {
            let  queryStr = `author=${uid}`
            let sortStr = 'create_at desc'
            let result = await this.find({queryStr,sortStr},1);
            let answerList = result.map((val)=>{
                return {name:val.name,cataId:val.id}
            })
            answer = {
                error:0,
                list:answerList,
                message:'成功',
                qiuet:true
            }
        }catch (err){
           
        }
        
        return answer;
    }



}



module.exports = cataLogModel;