function cataLog (mongoose){
    const cataLogSchema = mongoose.Schema({
        name:String,
        author:mongoose.Schema.Types.ObjectId,
        create_at:{type:Date,default:Date.now}
    })
    // 是否存在同名
    cataLogSchema.methods.hasSameName = async function (cataname){
        
        let result = await this.model('cataLog').count({name:cataname});
        return result;
    }




    // 增加分类
    cataLogSchema.statics.addCata = async function (ctx) {
        let {uid,cataname} = ctx.request.body;
        let data = {
            name:cataname,
            author:uid
        }
        let cata = new this(data)
        try {
            let res  = await cata.hasSameName(cataname);
            if (res){
                
                return {
                    error:1,
                    message:'文集同名'
                };
            }
            let result = await cata.save();
            let id = result['_id'].toString(),
                name = result['name'];
            
            return {data:{id,name},error:0,message:'文集添加成功'}
        }catch (err) {
            return  {
                error:1,
                message:'数据库错误'
            };
        }
    }

    // 删除分类
    cataLogSchema.statics.deleteCata = async function (ctx) {
        
        let {cataId} = ctx.request.body
        let result = await this.remove({_id:cataId});
        let answer={error:1,message:'删除出错'};
        if (result.ok==1){
            result.n==1&&(answer={error:0,message:'删除成功'})
            result.n==0&&(answer={error:1,message:'删除失败，文集不存在'})
        }
        return answer;

    }

    // 编辑分类
    cataLogSchema.statics.updateCata = async function (ctx) {
        let {cataId,newName} = ctx.request.body
        let result = await this.update({_id:cataId},{name:newName})
        let answer = {error:1,message:'重命名出错'}
        if (result.ok){
            result.n==1&&(answer={error:0,message:'重命名成功'})
            result.n==0&&(answer={error:1,message:'重命名出错,文集不存在'})
        }
        return answer
    }

    // 输出分类
    cataLogSchema.statics.getCatas = async function (ctx){
        let {uid} = ctx.request.body
        let answer = {
            error:1,
            message:'数据库错误,请稍后重试',
        };
        try {
            let result = await this.find({author:uid}).sort({'create_at':-1});
            let answerList = result.map((val)=>{
                return {name:val.name,cataId:val._id}
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


    let cataLogModel = mongoose.model('cataLog',cataLogSchema)
    return cataLogModel

}
module.exports = cataLog;