const sendEmail = require('../utils/email')
const md5 = require('../utils/md5')
const baseModel = require('./baseModel')




class userModel_sql extends baseModel {
    constructor(pool){
        super(pool)
        this.table = 'userInfo'
    }

    async register (ctx) {
        const {body} = ctx.request
        let queryStr = `email="${body.email}"`
        const users = await this.count({queryStr});
        if (users>0){
            ctx.body={message:'邮箱已被占用',error:1}
        }else{
            try{
                let data = {...body}
                delete data.captcha
                delete data.repassword
                data.password = data.password
                await this.insert(data);
                await this.active(ctx);
                ctx.body={message:'注册成功',error:0}
            }catch (err){
                ctx.throw(500,err);
            }
        }
    }

    async active (ctx){
        let {body} = ctx.request;
        try {
        let queryStr = `email="${body.email}"`
        let user = await this.findOne({queryStr})
        let email = {
            from:'博客管理猿<190780806@qq.com>',
            subject:'账户激活',
            to:body.email,
            html:`点击链接<a href="http://localhost:8080/#/active?code=${user.active_code}" target="_blank">点我激活</a>博客账户`
        }
        
            await sendEmail(email);
            ctx.body={error:1,message:`验证邮件已发送，请在注册邮箱(${body.email})查收`}
        }catch (err){
            ctx.throw(500,'激活邮件发送失败，请稍后重试');
        }
    }


    async checkActive  (ctx) {
        const {body} = ctx.request
        try {
            let queryStr = `email="${body.email}"`
            let result = await this.findOne({queryStr})
            console.log(result);
            return result&&result.isActive;
        }catch (err){
            ctx.throw(500,'数据库错误')
        }
    }

    async doActive (ctx) {
        let {code} = ctx.request.body

        // 验证码是否存在
        let queryStr = `active_code="${code}"`
        let user = await this.findOne({queryStr})
        if (!user){
            ctx.body={error:1,message:'该激活链接链接无效',errorcode:102}
        }else{
            if (new Date(user.code_outdate).getTime()<Date.now()){
                ctx.body={error:1,message:'链接已过期,请重新获取',errorcode:101}
                return;
            }
            
            let setStr = `isActive=1`
            let searchStr = `active_code="${code}"`
            let res = await this.update({setStr,searchStr})
            console.log(res);
            if (res){
                ctx.body={
                    error:0,
                    message:'恭喜您,激活成功!'
                }
            }
        }
    }


    async checkNamePass (ctx) {
        let {body} = ctx.request;
        console.log(body.password);
        body.password = md5(body.password);
        
        try {
            let queryStr = `email="${body.email}" AND password="${body.password}"`
            let result = await this.findOne({queryStr},1);
            console.log(result);
            return result;
        }catch (err){
            ctx.throw(500,'数据库错误');
        }
    }

    async login (ctx) {
        let isExit = await this.checkNamePass(ctx);
        if (!isExit) {
            ctx.body={
                error:1,
                message:'用户名或密码错误'
            }
            return;
        }
        let result = await this.checkActive(ctx);
        if (!result){
            await this.active(ctx);
            return false;
        }
        return isExit;
    }

}

module.exports= userModel_sql
