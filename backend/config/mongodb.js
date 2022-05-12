const mongoose = require("mongoose")
const dotenv = require('dotenv').config()
const connectDB = async () => {
  await mongoose.connect(
    process.env.DATABASE_MONGODB_URL, 
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
).then((con)=>console.log("Remote Database Connected")).catch((err)=>console.log(err))
}

module.exports = connectDB