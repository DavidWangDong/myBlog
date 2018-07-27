const sendEmail = require('../utils/email')
const md5 = require('../utils/md5')

function userModel (mongoose){
    const userSchema = mongoose.Schema({
        nickname:String,
        password:String,
        email:String,
        created_at:Date,
        updated_at:{type:Date,default:Date.now},
        active_code:String,
        code_outdate:Number,
        isActive:{type:Boolean,default:false},
        authority_id:[mongoose.Schema.Types.ObjectId]
    })

    // 注册
    userSchema.methods.register = async function (ctx){
        
        const {body} = ctx.request
        const users = await this.model('userInfo').count({'email':body.email});
        if (users>0){
            ctx.body={message:'邮箱已被占用',error:1}
        }else{
            try{
                await this.save();
                ctx.body={message:'注册成功',error:0}
                await this.model('userInfo').active(ctx);
            }catch (err){
                ctx.throw(500,err);
            }
        }
    }
    
    // 是否激活
    userSchema.statics.checkActive = async function (ctx) {
        const {body} = ctx.request
        try {
            let result = await this.findOne({email:body.email})
            return result&&result.isActive;
        }catch (err){
            ctx.throw(500,'数据库错误')
        }
    }
    

    // 激活
    userSchema.statics.doActive = async function (ctx) {
        let {code} = ctx.request.body

        // 验证码是否存在
        let user = await this.findOne({active_code:code})
        if (!user){
            ctx.body={error:1,message:'该激活链接链接无效',errorcode:102}
        }else{
            if (user.code_outdate<Date.now()){
                ctx.body={error:1,message:'链接已过期,请重新获取',errorcode:101}
                return;
            }
            
            let res =  await user.update({$unset:{active_code:"",code_outdate:""}}).set({isActive:true});
            if (res){
                ctx.body={
                    error:0,
                    message:'恭喜您,激活成功!'
                }
            }
        }
    }



    // 发送激活链接
    userSchema.statics.active = async function (ctx){
        let {body} = ctx.request;
        try {
        let user = await this.findOne({email:body.email})
        let email = {
            from:'博客管理猿<190780806@qq.com>',
            subject:'账户激活',
            to:body.email,
            html:`点击链接<a href="http://localhost:8080/#/active?code=${user.active_code}" target="_blank">点我激活</a>博客账户`
        }
        
            await sendEmail(email);
            ctx.body={error:0,message:`验证邮件已发送，请在注册邮箱(${body.email})查收`}
        }catch (err){
            ctx.throw(500,'激活邮件发送失败，请稍后重试');
        }
    }

    // 检查用户名和密码
    userSchema.statics.checkNamePass= async function (ctx) {
        let {body} = ctx.request;
        body.password = md5(body.password);
        
        try {
            let result = await this.findOne({email:body.email,password:body.password});
            
            return result;
        }catch (err){
            ctx.throw(500,'数据库错误');
        }
    }



    // 登陆
    userSchema.statics.login = async function (ctx) {
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

    let userModel = mongoose.model('userInfo',userSchema)
    return userModel
}

module.exports=userModel
