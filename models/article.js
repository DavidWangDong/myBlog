const baseModel = require('./baseModel')
class articleMod extends baseModel{
    constructor (pool){
        super(pool)
        this.table="articleinfos"
    }

    // 添加文章
    async addArticle(ctx){

        let {title,content,cataId,author} = ctx.request.body

        let answer = {
            error:1,
            message:'添加文章出错'
        }
        try {
            let data = {
                title,content,cataId,author
            }

            let res = await this.insert(data);
            let id = res.insertId
            if (id) {
              answer = {
                  error:0,
                  message:'添加成功',
                  articleId:id,
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
    async deleteArticle (ctx){
        let {articleId} = ctx.request.body
        let answer = {
            error:1,
            message:'删除失败'
        }
        let queryStr = `id=${articleId}`
        let result = await this.delete({queryStr})
    
        result.affectedRows==0&&(answer={error:1,message:'该文章不存在'})
        result.affectedRows>=1&&(answer={error:0,message:'删除成功'})
      
        return answer;
    }

    // 移动分类

    async classifyArticle (ctx) {
        let {articleId,cataId} = ctx.request.body
        let answer = {
            error:1,
            message:'移动失败'
        }
        try {
            let searchStr = `id=${articleId}`
            let setStr = `cataId=${cataId}`
            let result = await this.update({searchStr,setStr})
                result.affectedRows>=1&&(answer = {
                    error:0,
                    message:'移动成功'
                })
                result.affectedRows==0&&(answer = {
                    error:1,
                    message:'移动失败,该文章不存在'
                })
            
        }catch (err){
            answer = {
                error:1,
                message:'数据库错误'
            }
        }
        return answer;
    }

    // 更新文章

    async updateArticle(ctx){
        let {title,content,articleId} = ctx.request.body
        let answer = {
            error:1,
            message:'更新失败'
        }
        let data = {isPublished:0}
        title&&(data.title=title)
        content&&(data.content=content)
        
        try {
            
            let searchStr = `id=${articleId}`
            let setStr = this.getSetStr(data)
            
            let result = await this.update({searchStr,setStr},1)
            
                result.affectedRows>=1&&(answer={
                    error:0,
                    message:'更新成功',
                    qiuet:true
                })
                result.affectedRows==0&&(answer={
                    error:1,
                    message:'更新失败,该文章不存在',
                })
            
        }catch(err){
            answer={
                error:1,
                message:'数据库错误'
            }
        }

        return answer
    }


    // 获取文章列表
    async getArticles(ctx){
        let cataId = ctx.captures[0]
        let answer = {
            error:1,
            message:'获取文章列表失败',
            qiuet:true
        }
        try {
            let queryStr = `cataId=${cataId}`
            let sortStr = `create_at desc`
            let articles = await this.find({queryStr,sortStr},1)
            let data = articles.map((article)=> {return {articleId:article.id,title:article.title}})
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


    // 获取文章内容
    async getArticleContent (ctx) {
        let articleId = ctx.captures[0]
        let queryStr = `id=${articleId}`
        let result = await this.findOne({queryStr})
        let answer = {
            error:1,
            message:'获取内容失败',
            qiuet:true
        }
        if (result) {
            answer = {
                error:0,
                content:result.content,
                message:'获取内容成功'
            }
        }
        return answer;
    }


    
    async publishArticle (ctx){
        let articleId = ctx.captures[0]
        let answer = {
            error:1,
            message:'发布失败'
        }
        let setStr = `isPublished=1`
        let searchStr = `id=${articleId}`
        let result = await this.update({setStr,searchStr})
        
        result.affectedRows==0&&(answer={
            error:1,
            message:'发布失败,文章不存在'
        })
        result.affectedRows>=1&&(answer={
            error:0,
            message:'发布成功'
        })
            
        return answer;
    }





}


module.exports = articleMod;