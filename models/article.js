

function articleModel (mongoose) {
    const articleSchema = mongoose.Schema({
        title:String,
        content:String,
        cataId:mongoose.Schema.Types.ObjectId,
        author:mongoose.Schema.Types.ObjectId,
        created_at:{type:Date,default:Date.now},
        updated_at:{type:Date,default:Date.now}
    })

    // 添加文章
    articleSchema.statics.addArticle = async function(ctx){
        let {title,content,cataId,author} = ctx.request.body
        let answer = {
            error:1,
            message:'添加文章出错'
        }

        let article = new this({title,content,cataId,author})
        try {
            let res = await article.save();
            if (res) {
              answer = {
                  error:0,
                  message:'添加成功',
                  articleId:res['_id'],
                  qiuet:true
              }   
            }
        }catch(err){
            answer = {
                error:1,
                message:'数据库出错'
            }
        }

        return answer;
    }


    // 删除文章
    articleSchema.statics.deleteArticle = async function (ctx){
        let {articleId} = ctx.request.body
        let answer = {
            error:1,
            message:'删除失败'
        }
        let result = await this.remove({_id:articleId})
        if (result.ok==1){
            result.n==0&&(answer={error:1,message:'该文章不存在'})
            result.n==1&&(answer={error:0,message:'删除成功'})
        }
        return answer;
    }

    // 移动分类
    articleSchema.statics.classifyArticle = async function (ctx) {
        let {articleId,cataId} = ctx.request.body
        let answer = {
            error:1,
            message:'移动失败'
        }
        try {
            let result = await this.findOne({_id:articleId}).update({cataId:cataId})
            if (result.ok==1){
                result.n==1&&(answer = {
                    error:0,
                    message:'移动成功'
                })
                result.n==0&&(answer = {
                    error:1,
                    message:'移动失败,该文章不存在'
                })
            }
        }catch (err){
            answer = {
                error:1,
                message:'数据库错误'
            }
        }
        return answer;
    }

    // 更新文章  //标题  内容
    articleSchema.statics.updateArticle = async function(ctx){
        let {title,content,articleId} = ctx.request.body
        let answer = {
            error:1,
            message:'更新失败'
        }
        let data = {}
        title&&(data.title=title)
        content&&(data.content=content)
        data.updated_at = new Date()
        try {
            
            let result = await this.findOne({_id:articleId}).update(data)
            if (result.ok==1){
                result.n==1&&(answer={
                    error:0,
                    message:'更新成功',
                    qiuet:true
                })
                result.n==0&&(answer={
                    error:1,
                    message:'更新失败,该文章不存在',
                })
            }
        }catch(err){
            answer={
                error:1,
                message:'数据库错误'
            }
        }

        return answer
    }


    // 获取文章列表
    articleSchema.statics.getArticles = async function(ctx){
        let cataId = ctx.captures[0]
        let answer = {
            error:1,
            message:'获取文章列表失败',
            qiuet:true
        }
        try {
            let articles = await this.find({cataId}).sort({created_at:-1})
            let data = articles.map((article)=> {return {articleId:article._id,title:article.title}})
            answer = {
                error:0,
                list:data,
                message:'获取列表成功'
            }
        }catch (err){
            answer = {
                error:1,
                message:'数据库错误',
                qiuet:true
            }
        }

        return answer;
    }

    let articleModel = mongoose.model('articleInfo',articleSchema)
    return articleModel;

}

module.exports = articleModel;