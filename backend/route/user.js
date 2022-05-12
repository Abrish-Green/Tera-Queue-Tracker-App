const express = require('express')
const router = express.Router()

//Signup
router.post('/signup', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})

//Signin
router.post('/signin', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})

//Signout
router.post('/signout', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
})
//POST /api/user/:userid/event/create
router.post('/:userid/event/create', (req, res)=>{
    return res.status(200).json({
        "status": 200
    })
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
