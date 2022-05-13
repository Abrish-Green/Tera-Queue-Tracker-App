const express = require('express')
const app = express()
const dotenv = require('dotenv').config()
const API = express.Router()
const port = process.env.PORT
var cors = require('cors')

const connectDB = require('./config/mongodb')

const cookieParser = require("cookie-parser");

app.use(cors())

app.use(express.json());
app.use(cookieParser());

app.use((req,res,next)=>{
  console.log(req.url)
  next()
})
try{
  connectDB()
}catch(err){
  console.log("reconnecting to server wait...")
  connectDB()
}


app.use('/api/', API)

API.use('/user/',require('./routes/user'))


app.listen(port, () => {
  console.log(`Development Port:${port}`)
})