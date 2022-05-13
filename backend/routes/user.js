const express = require('express')
const User = require('../model/User')
const router = express.Router()
const crypto = require('crypto')
const { default: mongoose } = require('mongoose')
const { validate } = require('../model/User')
const Event = require('../model/Event')

//Geteway
router.get('/',(req,res)=>{
    return res.status(200).json({
        "url": req.url,
        "status": 200
    })
})


//Signup
router.post('/signup',  async(req,res)=>{
    const { username, password } = req.body
    let error = []
    if(!username) error.push({username: "username cant't be empty"})
    if(!password)  error.push({password: "password can't be empty"})

    if(error.length > 0){
        return res.status(202).json({
            "error":error
        })
    }

   try{
        const newUser = new User(req.body)
        newUser.setPassword(password)
        newUser.generateJWT()
        await newUser.save(function(err,result){
            if (err){
                return res.status(202).json(err);
            }
            return res.status(200).json({
                "status":200,
                "user": result
            })
        })
   }catch(e){
        return res.status(200).json({
            "status":202,
            "message": "Unable to Signup an account.Try Again later..." 
        })
   }
    
})

//Signin
router.post('/signin',async (req, res)=>{
    const { username, password } = req.body
    let error = []
    if(!username) error.push({username: "username cant't be empty"})
    if(!password)  error.push({password: "password can't be empty"})

    if(error.length > 0){
        return res.status(202).json({
            "error":error
        })
    }
    let user = await User.findOne({ username: username}).exec();
    
    if(user != null){
        try{       
                var inputHash = crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex');

                if(user.password == inputHash){
                   
                    var tempUser = new User()
                    tempUser.password = user.password
                    tempUser.salt = user.salt
                    
                    var token =  tempUser.generateJWT();
                    var today = new Date();
                    var exp = new Date(today);
                    exp.setDate(today.getDate() + 60);
                    res.cookie("jwt_token", token, {
                        httpOnly: true,
                        maxAge: parseInt(exp.getTime() / 1000), // 3hrs in ms
                    });
                    return res.status(200).json({
                        "status":'GOOD',
                        "jwt_token": token,
                        
                    })
                }
                return res.status(202).json({
                    "status":'WARNING',
                    "error":"Incorrect Credential",
                }) 
        
        }catch(e){
            //console.error(e)
            
        }
        
    }
    return res.status(200).json({
        "status":'BAD',
        "error":"User Not Found"
    }) 

})

//Signout
router.post('/signout',async (req, res)=>{
    
    if(!req.body.jwt_token){
        return res.status(200).json({
            "status":'WARNING',
            "message": "Jwt_token is not provided..."
        })
    }
    try{
        const { _id, username} = req.body
        await User.findOneAndUpdate({_id:_id, username: username},{ token: ''}).exec()
        return res.status(200).json({
            "status": 'GOOD',
            "message": 'logged out'
        })
    }catch(e){
        // Error Handling
        //console.error(e)
    }
    
    return res.status(200).json({
        "status": 'BAD',
        "message": 'Invalid jwt_token'
    })
})

//POST /api/user/:userid/event/create
router.post('/:userid/event/create',async (req, res)=>{
    
    //Create Event 
     const { name, event_owner_id, queue_status } = req.body
     const { userid } = req.params
     
     let error = []
     if(!name) error.push({ name: "name can't be empty"})
     if(!queue_status) error.push({queue_status: "queue_status can't be empty"})
     if(error.length > 0){
        return res.status(200).json({
            "status": 'BAD',
            "error": error
        })
     }

     const session_started = new Date();
     
     try{
        const newEvent = new Event({
            name: name,
            session_started: session_started.toISOString(),
            queue_status: queue_status,
            event_owner_id: userid,
            event_logger: [
                { "log": `Session Started at : ${session_started.toGMTString()}`}
            ]
        })


        await newEvent.save(function(err,event){
            if(err){
                //console.error(err)
                return res.status(200).json({
                    "status": 'BAD',
                    "message": "Unable to create an event"
                })
            }
           return res.status(200).json({
               "status": 'GOOD',
               "event": event
           })
        })     
     }catch(e){
        //Error Handle
        return res.status(200).json({
            "status": 'BAD',
            "message": "Unable to create an event"
        })
     }
     
})



//GET /api/user/:userid/events/?q=param
router.get('/:userid/events/?q=param', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// POST /api/user/:userid/event/:event_id/manage_queue
router.post('/:userid/event/:event_id/manage_queue', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// GET /api/user/:userid/event/:event_id/get_current_queue
router.get('/:userid/event/:event_id/get_current_queue', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// GET /api/user/:userid/event/:event_id/get_report
router.get('/:userid/event/:event_id/get_report', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// POST /api/user/:userid/event/:event_id/join_queue
router.post('/:userid/event/:event_id/join_queue', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// POST /api/user/:userid/event/:event_id/leave_queue
router.post('/:userid/event/:event_id/leave_queue', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
// POST /api/user/:userid/event/:event_id/event_logger
router.post('/:userid/event/:event_id/event_logger', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})

module.exports = router
