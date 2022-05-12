const express = require('express')
const router = express.Router()
var crypto = require('crypto');
const User = require('../model/User')
var validator = require('validator');
const { AuthUser } = require('../middleware/auth')
var jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail')
// ADD ACCOUNT
router.post('/sign_up', async(req,res)=>{
    const { password } = req.body
    let error = []
    if(!password) 
        return res.status(202).json({"error":{password: "password can't be empty"}})

    if(error.length > 0){
        return res.status(202).json({
            "error":error
        })
    }

    const newUser = new User(req.body)
    newUser.setPassword(password)
    await newUser.save(function(err,result){
        if (err){
            return res.status(202).json(err);
        }
        else{
            const user = newUser
            //THE LINK SHOULD BE FRONT-END LINK
            const link = `${process.env.PUBLIC_URL}/api/v1/auth/verify/user/${user._id}/${user.salt}`
            try{
                (async()=>{
                    await sendEmail(user.email,"Verify Your Account",{username: user.username,link: link,},"../utils/template/verifyAccount.handlebars");
                        return res.status(200).json({
                            "status":"success",
                            "message":`Email has been Sent to ${user.email}`,
                            "link":link,
                            "jwt_token": newUser.generateJWT()
                    })
            }) ();  
                }catch(err){
                        return res.status(500).json({
                            "status":"fail",
                            "error": err,
                            "message":`Email wasn't Sent to ${user.email}`
                        })
    }      
        }
    })

    //store password
    //save
    
})

router.get("/verify/user/:userId/:saltToken",async (req,res)=>{
    const {userId, saltToken } = req.params
    const user = await User.findOne({"_id":userId}).exec()
    
    if(user.verified != null){
       if(user.verified) return res.status(201).json({
            "status":"fail",
            "message":"your account is already verified"
        })
    }


    
        if(saltToken !== user.salt){
            return res.status(201).json({
                "status":"fail",
                "message":"Invalid Token"
            })
        }
        await User.updateOne(
            { _id: user._id },
            { $set: { verified: true } },
            {new:true}
        );
        
        return res.status(200).json({
            "status":"success",
            "verified":user.verified
        })
})
// LOGIN
router.post('/login',async(req,res)=>{

    const { email, password } = req.body
    if((!email || validator.isEmail(email) == false) || (!password))  {
        return res.status(202).json({"error": "Incorrect input"})
    }
    let user = await User.find({ email: email});

    if(user.length >0){
        //hash compare pass
        var inputHash = crypto.pbkdf2Sync(password, user[0].salt, 10000, 512, 'sha512').toString('hex');

        if(user[0].hash == inputHash){
            var tempUser = new User()
            tempUser.hash = user[0].hash
            tempUser.salt = user[0].salt
            
            var token =  tempUser.generateJWT();
            var today = new Date();
            var exp = new Date(today);
            exp.setDate(today.getDate() + 60);
            res.cookie("jwt_token", token, {
                httpOnly: true,
                maxAge: parseInt(exp.getTime() / 1000), // 3hrs in ms
              });
            return res.status(200).json({
                "status":"success",
                "jwt_token": token,
                
            })
        }
        return res.status(402).json({
            "status":"failed",
            "error":"Incorrect Credential",
        }) 
    }
    
    return res.status(402).json({
        "status":"failed",
        "error":"User Not Found"
    }) 

})

// LOGOUT
router.post("/logout", AuthUser, (req, res) => {
    res.cookie("jwt_token", "", {
        httpOnly: true,
        maxAge: 1,
      });
    return res.status(200).json({
        "status":"success",
        "message":"User Logged out Successfully"
    })
  })
// RESET PASSWORD
router.post("/passwordReset", async (req,res)=>{
    
        if(req.body.email != null){
            if(req.body.email === "") return res.status(201).json({
                "status":"fail",
                "message":"Email can't be null"
            })

        const user  = await User.findOne({email: req.body.email}).exec()
            if(user){
                    
                    await User.updateOne(
                        { _id: user._id },
                        { $set: { resetToken: "" } },
                    );
                      
                      var today = new Date();
                    var exp = new Date(today);
                    exp.setDate(today.getDate() + 60);
                    
                    
                const resetToken = jwt.sign({id: user._id,email: user.email,exp: parseInt(exp.getTime() / 1000),}, process.env.JWT_SECRET);
                const resetHashToken =  crypto.pbkdf2Sync(resetToken, process.env.JWT_SECRET, 10000, 50, 'sha512').toString('hex');
                
                await User.updateOne(
                    { _id: user._id },
                    { $set: { resetToken: resetHashToken } },
                  );
                  const link = `${process.env.PUBLIC_URL}/passwordReset?token=${resetHashToken}&id=${user._id}`;
                  try{
                    await sendEmail(user.email,"Password Reset Request",{name: user.username,link: link,},"../utils/template/resetEmail.handlebars");
                        return res.status(200).json({
                            "status":"success",
                            "message":`Email has been Sent to ${user.email}`,
                            "link":link
                    })
                }catch(err){
                      return res.status(500).json({
                          "status":"fail",
                          "error": err,
                          "message":`Email wasn't Sent to ${user.email}`
                      })
                  }  
            }
            return res.status(201).json({
                "status":"fail",
                "message":"User Not Found"
            })
           
        }

    return res.status(201).json({
        "status":"fail",
        "message":"please provide a valid [email] to use route"
    })
})

router.post("/passwordReset/confirm",async(req,res)=>{
    const error = []
    //send email
        //for reset(userId, token, password)
        if(req.body.UserId != null || req.body.token != null || req.body.password != null){
            if(!req.body.UserId) error.push({"UserId":"UserId can't be null"})
            if(!req.body.token) error.push({"token":"token can't be null"})
            if(!req.body.password) error.push({"password":"password can't be null"})
        }
        
        
        if(req.body.UserId && req.body.token && req.body.password){
            const { UserId, token, password } = req.body
            
            await User.findOne({_id: UserId}, async (err, user) =>{
                if (err) {
                  console.log(err);
                  error.push(err)
                } 
                if(user.resetToken !== token){
                    return res.status(201).json({
                        "status":"fail",
                        "message":"token does't match"
                    })
                }
                //update password
                const salt = user.salt;
                const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
                    await User.updateOne(
                        { _id: user._id },
                        { $set: {hash: hashedPassword,resetToken:"" } },
                      );
                
                try{
                    
                    await sendEmail(user.email,"Password Reset Successful",{username: user.username,email:user.email, homePageUrl:`${process.env.PUBLIC_URL}/`,from:`${process.env.PRODUCTION_FROM_EMAIL}`, telephone:"+251-9-XX-XX-XX"},"../utils/template/successfulResetEmail.handlebars");
                        return res.status(200).json({
                            "status":"success",
                            "message":`Email has been Sent to ${user.email}`
                    });
                    
                }
                catch(err){
                      return res.status(500).json({
                          "status":"fail",
                          "error": err,
                          "message":`Email wasn't Sent to ${user.email}`
                      })
                  }  
                  
              }).clone()
          
        }
        if(error.length > 0) return res.status(201).json({
            "status":"fail",
            "error":error
        })
       

})






module.exports = router