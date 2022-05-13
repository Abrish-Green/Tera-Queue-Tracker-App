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
router.get('/:userid/events/', (req, res)=>{
    let { q } = req.query;
    if(q == null) q = '' 
    try{
        Event.find({ name: { $regex: `${q}`, $options: "i" } }, function(err, docs) {
            return res.status(200).json({
                "status": 'GOOD',
                "found_item": docs.length,
                "result": docs
                
            })
        });
        
    }catch(e){
        return res.status(200).json({
            "status": 'BAD',
            "found_item": 0,
            "result": [],
            "message":"Unable to retrive Data"
            
        })
    }
    
   
})

// POST /api/user/:userid/event/:event_id/manage_queue
router.post('/:userid/event/:event_id/manage_queue',async (req, res)=>{

    try{
        const { userid, event_id } =  req.params 
        let UpdatedData;
        if('queue_status' in req.body){
            const { queue_status } = req.body;
            if( typeof queue_status == 'boolean'){
                await Event.findByIdAndUpdate(event_id,{queue_status: queue_status}).exec()
                if(queue_status){
                    const session_started = new Date()
                    await Event.findByIdAndUpdate(event_id,{
                        "$set": {
                            "event_logger": []
                        }
                    }).exec() 
                    await Event.findByIdAndUpdate(event_id,{
                        "$push":{
                            "event_logger":  { "log": `Session Started at : ${session_started.toGMTString()}`}
                        }
                    }).exec() 
                }
                UpdatedData = await Event.findOne({_id:event_id}).exec();
                return res.status(200).json({
                    "status":"GOOD",
                    "data": UpdatedData
                })
            }else{
                throw Error()
            }
           
        }

        if('end_session' in req.body){
            const { end_session } = req.body;
            if( typeof end_session == 'boolean'){
                const session_lasted_date =  Date; 
                await Event.findByIdAndUpdate(event_id,{
                    "$set": { 
                        session_lasted: session_lasted_date.now(),
                        queue_status: !end_session
                    },
                    "$push": {
                        "event_logger": {
                                "log": `Session Ended at: ${new Date().toGMTString()}  `
                             }
                         } 
                   
                
                },{ "new": true, "upsert": true }).exec()
              
                UpdatedData = await Event.findOne({_id:event_id}).exec();
                return res.status(200).json({
                    "status":"GOOD",
                    "data": UpdatedData
                })
            }else{
                throw Error()
            }
        }

    }catch(e){
        //Handle Error
        console.error(e)
        return res.status(200).json({
            "status": 'BAD',
            "message": "Unable to Execute the task"
        })
    }
    
    
})

// GET /api/user/:userid/event/:event_id/get_current_queue
router.get('/:userid/event/:event_id/get_current_queue',async (req, res)=>{
    const { event_id } = req.params
    try{
        const queue  = await Event.findById(event_id).exec()
        if(!queue){
            return res.status(200).json({
                "status": 'BAD',
                "message": "Event Doesn't Exist"
            })
        }
        const { current_queue } = queue;
        return res.status(200).json({
            "status": 'GOOD',
            "participants": current_queue.length,
            "current_queue": current_queue
        })

    }catch(e){
        //Handle Error
        return res.status(200).json({
            "status": 'BAD',
            "message": "Unable to retrive data"
        })
    }

   
})

// GET /api/user/:userid/events/
router.get('/:userid/myevents',async (req, res)=>{

    try{
        const { userid } = req.params
        const events = await Event.find({event_owner_id: userid }).exec() || []
      
        if(events.length > 0){
            return res.status(200).json({
                "status": 'GOOD',
                "found_items": events.length,
                "events": events
            })
        }

        return res.status(200).json({
            "status": 'GOOD',
            "message": 'There is no events yet'
        })
    }catch(e){
        //Handle Error
        //console.error(e)
        return res.status(200).json({
            "status": 'BAD',
            "message": "Unable to retrive data"
        })
    }
    
})

// GET /api/user/:userid/event/:event_id/get_report
router.get('/:userid/event/:event_id/get_report',async (req, res)=>{

    // Report
    // Session started at and end at
    // Participated and Dropped Users
    // Event History

    try{
        const { userid, event_id } = req.params

        const event = await Event.findById(event_id).exec()
        if(event != null){
            if(event.event_owner_id == userid){
                const report = {
                    "session_started": event.session_started.toGMTString(),
                    "session_lasted": event.session_lasted,
                    "participated_peoples": event.participated_people.length,
                    "active_participants": event.current_queue.length,
                    "dropped_peoples": event.dropped_people.length,
                    "event_history": event.event_logger
                }
                return res.status(200).json({
                    "status": 'GOOD',
                    "report": report
                })
            }
            return res.status(200).json({
                "status": 'WARNING',
                "message": 'Not Authorized'
            })
            
        }
        return res.status(200).json({
            "status": 'WARNING',
            "message": 'No event found'
        })
    }catch(e){
        //Handle Error
            return res.status(200).json({
                "status": 'BAD',
                "message": 'Unable to retrive data'
            })
    }
})
// POST /api/user/:userid/event/:event_id/join_queue
router.post('/:userid/event/:event_id/join_queue',async (req, res)=>{
    
    try{
        const { userid, event_id} = req.params
        const user  = await User.findById(userid).exec()
        if(!user) {
            return res.status(200).json({
                    "status": 'BAD',
                    "message": "User Not Found"
                })
        }
        const { username } = user
        const { queue_status } = await Event.findById(event_id).exec()
        if(queue_status){
            const ifAlreadyJoined = await Event.findById(event_id).exec()
            const joined = ifAlreadyJoined.current_queue.filter(data=> data.username == username);

            if(joined.length > 0){
                return res.status(200).json({
                    "status": 'WARNING',
                    "message": "User Already Joined"
                })
            }
            const registedBefore = ifAlreadyJoined.participated_people.filter(data=> data.username == username);

            if(registedBefore.length == 0){
                await Event.findByIdAndUpdate(event_id,{
                    "$push": { 
                        "participated_people": { username},
                        
                    }
                }).exec();
            }
            
            await Event.findByIdAndUpdate(event_id,{
                "$push": { 
                    "current_queue": {username: username},
                    "event_logger":{
                        "log": `${username} just joined, ${new Date().toGMTString()}`
                    }
                }
            }).exec();
            const queue  =  await Event.findById(event_id).exec()
            return res.status(200).json({
                "status": 'GOOD',
                "queue": queue
            })
        }else{
            res.status(200).json({
                "status": 'WARNING',
                "message": "Queue is Closed"
            })
        }
        
    }catch(e){
        //Handle Error
        //console.error(e)
        return res.status(200).json({
            "status": 'BAD',
            "message": 'Unable to Join'
        })
    }
    

})
// POST /api/user/:userid/event/:event_id/leave_queue
router.post('/:userid/event/:event_id/leave_queue',async (req, res)=>{
    
    try{
        const { userid, event_id} = req.params
        const user  = await User.findById(userid).exec()
        if(!user) {
            return res.status(200).json({
                    "status": 'BAD',
                    "message": "User Not Found"
                })
        }
        const { username } = user
        const { queue_status } = await Event.findById(event_id).exec() || []
        if(queue_status){
            const ifAlreadyJoined = await Event.findById(event_id).exec()
            
            const joined = ifAlreadyJoined.current_queue.filter(data=> data.username == username);

            if(joined.length > 0){
               
                await Event.findByIdAndUpdate(event_id,{
                     "$pull": {'current_queue': { username: username } },
                     "$push": {
                            "event_logger":{
                                "log": `${username} left the Queue, ${new Date().toGMTString()}`,
                            },
                            "dropped_people":{ username }


                    }
                }
                ).exec();
                const queue  =  await Event.findById(event_id).exec()
                return res.status(200).json({
                    "status": 'GOOD',
                    "queue": queue
                })
            }
            return res.status(200).json({
                "status": 'WARNING',
                "message": "User Didn't Joined yet"
            })
            
        }else{
            res.status(200).json({
                "status": 'WARNING',
                "message": "Queue is Closed"
            })
        }
        
    }catch(e){
        //Handle Error
        console.error(e)
        return res.status(200).json({
            "status": 'BAD',
            "message": 'Unable to Leave'
        })
    }
    
   
})

module.exports = router
