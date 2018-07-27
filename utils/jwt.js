const jwt = require('jsonwebtoken')


const jwtObj = {
    key:'coderBlog:secrets',
    createToken (data) {
        console.log(data);
        let token = jwt.sign(data,this.key/*,{expiresIn: 3600}*/)
        return token;
    },
    verify (token) {
        return new Promise((resolve,reject)=>{
            jwt.verify(token,this.key,(err,decode)=>{
                if (err) reject(err);
                resolve(decode)
            })
        })
        
    }
}

module.exports = jwtObj