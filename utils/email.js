const mailer = require('nodemailer')
var config = {
    host: 'smtp.qq.com', 
    port: 465,
    auth: {
        user: '190780806@qq.com', 
        pass: 'jcjtmbxddrrmbjid'  
    }
}

const tranporter = mailer.createTransport(config)

async function sendMail (mail){
    let result  = await tranporter.sendMail(mail);
    return result;
}
module.exports = sendMail;