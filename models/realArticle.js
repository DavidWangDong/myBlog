const {markdown} = require('markdown')
const {JSDOM} = require('jsdom')
const {window} = new JSDOM('<!DOCTYPE html><html><body></body></html>')
const $ = require('jquery')(window)
const baseModel = require('./baseModel')

class realArticle extends baseModel {
    constructor(pool){
        super(pool)
        this.table="realarticleinfo"
    }


    async getArticleList (ctx) {
        let sql = `CALL getArticles()`
        let res = await this.query(sql)
        res = res[0]
        let answer = {
            error:1,
            message:'获取列表失败'
        }
        if (res){
            
            let list = res.map((article)=>{
                
                let shortContent = $(markdown.toHTML(article.content)).text().slice(0,75)
                shortContent.length>=75&&(shortContent+='...')
                article.content = shortContent;
                return article;
            })

            answer = {
                error:0,
                message:'获取列表成功',
                data:list
            }
        }

        return answer
    }


    async getArticle (ctx){
        let articleId = ctx.captures[0]
        let sql = `CALL getArticle(${articleId})`
        let res = await this.query(sql)
        res = res[0][0]
        let answer = {
            error:1,
            message:'获取文章失败'
        }
        if (res){
            answer = {
                error:0,
                message:'获取文章成功',
                data:res
            }
        }
        return answer;
    }

    async getHotList (ctx){
        let sql = `CALL getHotList()`
        let res = await this.query(sql)
        res = res[0]
        let answer = {
            error:1,
            message:'获取热度列表失败'
        }
        if (res){
            answer = {
                error:0,
                message:'获取热度列表成功',
                data:res
            }
        }
        return answer;
    }


    async getNewList (ctx){
        let sql = `CALL getNewList()`
        let res = await this.query(sql)
        res = res[0]
        let answer = {
            error:1,
            message:'获取最新列表失败'
        }
        if (res){
            answer = {
                error:0,
                message:'获取最新列表失败',
                data:res
            }
        }
        return answer;
    }


}

module.exports = realArticle