const koa = require('koa');
const fs = require('fs')
const path = require('path')
const app = new koa();
const Router = require('koa-router')
const router = new Router({
    prefix: '/api'
});

const md5 = require('./utils/md5')
const session = require('koa-session')
const sessionConfig = require('./config/session')
const svgCaptcha = require('svg-captcha')
const jwtObj = require('./utils/jwt')
const koaBody = require('koa-body')
const serve = require('koa-static')
const parseTime = require('./utils/time')

var userModel;
var cataLogModel;
var articleModel;
var realArticleModel;


//mysqlDB
const mysql = require('mysql')
const pool = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'root',
    database:'blog'
})


app.keys = ['myblog']

app.use(session(sessionConfig,app))

app.use(koaBody({multipart:true}))
const statics = serve(path.join(__dirname,'uploads'))

app.use(async (ctx,next)=>{
    
    ctx.userModel = new (require('./models/userModel'))(pool)
    ctx.cataLogModel = new (require('./models/cataLog'))(pool);
    ctx.articleModel = new (require('./models/article'))(pool);
    ctx.realArticleModel = new (require('./models/realArticle'))(pool);

    cataLogModel = ctx.cataLogModel
    articleModel = ctx.articleModel
    userModel = ctx.userModel
    realArticleModel = ctx.realArticleModel
    await next();
})

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
        
        let queryStr = `id=${data.uid}`
        let findUser = await userModel.findOne({queryStr},1)
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
        let token = jwtObj.createToken({uid:user['id'].toString()})
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
    body.code_outdate = parseTime(Date.now()+(24*3600*1000))
    body.active_code = md5(body.email+Date.now())
    await userModel.register(ctx);
})


// 激活
router.post('/active',async (ctx,next)=>{
    await userModel.doActive(ctx);
})

// 获取激活邮件
router.get('/activecode',async (ctx,next)=>{
    let {code} = ctx.request.query
    let queryStr = `active_code="${code}"`
    let user = await userModel.findOne({queryStr})
    
    if (!user){
        ctx.body={
            error:1,
            message:'获取链接失败'
        }
        return
    }
    let codeNew = md5(user.email+Date.now())

    let setStr = `active_code="${condeNew},code_outdate="${parseTime(Date.now()+(24*3600*1000))}"`
    await userModel.update({setStr,searchStr:queryStr})
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
    let queryStr = `id=${cataId}`
    let res = await cataLogModel.findOne({queryStr})
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

// 获取文章内容
router.get('/getArticleContent/:articleId',async (ctx,next)=>{
    let result = await articleModel.getArticleContent(ctx);
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

// 图片上传
router.post('/uploadPic',async (ctx,next)=>{
    let {files} = ctx.request
    let path = files['myfile'].path;
    let name = files['myfile'].name
    let targetPath = Date.now()+''+parseInt(Math.random().toString()*10000)+'.'+name.split('.').pop()
    let writer = fs.createWriteStream(`./uploads/${targetPath}`,{flag:'w+'})
    let reader = fs.createReadStream(path)
    reader.pipe(writer)
    ctx.body={
        error:0,
        message:'上传成功',
        data:{path:`${ctx.origin}/${targetPath}`,name}
    }
})


// 发布文章
router.get('/publishArticle/:articleId',async (ctx,next)=>{
    let result = await articleModel.publishArticle(ctx);
    ctx.body = result;
})

// 获取已发布的文章
router.get('/getArticleList',async (ctx,next)=>{
    let result = await realArticleModel.getArticleList(ctx);
    ctx.body = result;
})

// 获取单个文章
router.get('/getArticle/:articleId',async (ctx,next)=>{

    let result = await realArticleModel.getArticle(ctx)
    ctx.body = result

})


// 获取最热文章
router.get('/getHotList',async (ctx,next)=>{
    let result = await realArticleModel.getHotList(ctx)
    ctx.body = result
})  

// 获取最新文章
router.get('/getNewList',async (ctx,next)=>{
    let result = await realArticleModel.getNewList(ctx)
    ctx.body = result
})  

app.use(router.routes())
app.use(statics)
app.listen(3000)