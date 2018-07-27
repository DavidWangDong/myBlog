const koa = require('koa');
const app = new koa();
const Router = require('koa-router')
const router = new Router({
    prefix: '/api'
});
const bodyParser = require('koa-bodyparser')
const md5 = require('./utils/md5')
const session = require('koa-session')
const sessionConfig = require('./config/session')
const svgCaptcha = require('svg-captcha')
const jwtObj = require('./utils/jwt')

var userModel;
var cataLogModel;
var articleModel;



var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/blog')
var dbc = mongoose.connection;

dbc.on('error', () => {
    console.log('数据库链接失败')
})
dbc.on('open', () => {
    console.log('数据库链接成功')
    userModel = require('./models/userModel')(mongoose)
    cataLogModel = require('./models/cataLog')(mongoose)
    articleModel = require('./models/article')(mongoose)
})
dbc.on('disconnected', () => {
    console.log('数据库断开链接')
})




app.keys = ['myblog']
app.use(session(sessionConfig,app))
app.use(bodyParser())
app.use(async (ctx,next)=>{
     // 验证码
     
     try {

     
        let needRoutes = ['/api/login','/api/register'];
        if (needRoutes.indexOf(ctx.path)>-1){
            let correct = ctx.session.captchaText
            let {body} = ctx.request
            if (!body.captcha){
                ctx.status=200;
                ctx.body={error:1,message:'验证码错误',errorcode:100}
                return;
            }
            if(body.captcha.toLowerCase()!=correct.toLowerCase()){
                ctx.status=200;
                ctx.body={error:1,message:'验证码错误',errorcode:100}
                return;
            }
        }
    }catch(err){
            ctx.status=200;
            ctx.body={error:1,message:'服务器错误',errorcode:200}
            return;
    }

     await next()
 
})

app.use(async (ctx,next)=>{
    try {
        await next()
    } catch(err) {
        ctx.status = 200;
        ctx.body = {error:1,message:err.message};
    }
})

// 授权管理
app.use(async (ctx,next)=>{
    let authRoute = ['/addCata','/updateCata','/deleteCata','/getCatas','/addArticle','/deleteArticle','/classifyArticle','/updateArticle']
    if (authRoute.some((route)=>{
        return ctx.path.indexOf(route)>-1
    })){

        const {headers} = ctx.request
        const {authorization} = headers
        try{
            var data = await jwtObj.verify(authorization);
            ctx.request.body.uid = data.uid;
            ctx.request.body.author = data.uid;
        }catch(err){
            ctx.body={
                error:1,
                message:'该操作需要用户登陆',
                errorcode:107
            }
            return;
        }
    }

    await next()
})


router.post('/refresh',async (ctx,next)=>{
    const {headers} = ctx.request
    const {authorization} = headers
   
        
        try{
            var data = await jwtObj.verify(authorization);
        }catch(err){
            ctx.body={
                error:1,
                message:err.message,
                qiuet:true,
                errorcode:104
            }
            return;
        }
        
        let findUser = await userModel.findOne({'_id':data.uid})
        if (findUser){
            ctx.body={
                error:0,
                data:findUser,
                message:'登陆成功'
            }
            return
        }

        ctx.body={
            error:1,
            message:'用户不存在',
            qiuet:true,
            errorcode:105
        }
})


router.post('/login',async (ctx,next)=>{
    const {body} = ctx.request
    const {email,password} = body
    
    let user = await userModel.login(ctx);
    if (user){
        let token = jwtObj.createToken({uid:user['_id'].toString()})
        ctx.set('Authorization',token);
        let data = {nickname} = user;
        ctx.body={
            error:0,
            data,
            message:'登陆成功'
        }
    }
})

router.post('/register',async (ctx,next)=>{
    const {body} = ctx.request
    body.password = md5(body.password)
    body.created_at = Date.now()
    body.code_outdate = Date.now()+(24*3600*1000)
    body.active_code = md5(body.email+Date.now())
    let tmpUser = new userModel(body)
    await tmpUser.register(ctx);
})


// 激活
router.post('/active',async (ctx,next)=>{
    await userModel.doActive(ctx);
})

// 获取激活邮件
router.get('/activecode',async (ctx,next)=>{
    let {code} = ctx.request.query
    let user = await userModel.findOne({active_code:code})
    
    if (!user){
        ctx.body={
            error:1,
            message:'获取链接失败'
        }
        return
    }
    let codeNew = md5(user.email+Date.now())
    await user.set({active_code:codeNew,code_outdate:Date.now()+(24*3600*1000)})
    await user.save();
    ctx.request.body.email = user.email;
    await userModel.active(ctx);
    ctx.body={
        error:0,
        code:codeNew,
        message:'获取链接成功'
    }
})






// 增加文章分类
router.post('/addCata',async (ctx,next)=>{
    let result = await cataLogModel.addCata(ctx);
    ctx.body = result;
})

// 删除文章分类
router.post('/deleteCata',async (ctx,next)=>{
    let result = await cataLogModel.deleteCata(ctx);
    ctx.body=result;
})

//重命名文章分类
router.post('/updateCata',async (ctx,next)=>{
    let result = await cataLogModel.updateCata(ctx);
    ctx.body = result;
})

// 输出分类
router.get('/getCatas',async (ctx,next)=>{
    let result = await cataLogModel.getCatas(ctx);
    ctx.body = result;
})



// 添加文章
router.post('/addArticle',async (ctx,next)=>{
    let result = await articleModel.addArticle(ctx);
    ctx.body = result;
})

// 删除文章
router.post('/deleteArticle',async (ctx,next)=>{
    let result = await articleModel.deleteArticle(ctx);
    ctx.body = result;
})

// 移动文章
router.post('/classifyArticle',async (ctx,next)=>{
    // 是否存在分类
    let result;
    let {cataId} = ctx.request.body
    let res = await cataLogModel.findOne({_id:cataId})
    if (!res) {
        ctx.body={
            error:1,
            message:'分类不存在'
        }
        return;
    }
    result = await articleModel.classifyArticle(ctx)
    ctx.body = result;
})
// 更新文章
router.post('/updateArticle',async (ctx,next)=>{
    let result = await articleModel.updateArticle(ctx)
    ctx.body=result;
})
// 输出文章
router.get('/getArticles/:articleId',async (ctx,next)=>{
    let result = await articleModel.getArticles(ctx);
    ctx.body=result;
})

// 验证码
router.get('/captcha',async (ctx,next)=>{
    let captcha = svgCaptcha.create();
    ctx.session.captchaText = captcha.text;
    ctx.type='svg'
    ctx.status=200
    ctx.body=captcha.data;
})


app.use(router.routes())
app.listen(3000)