const jwt = require('jsonwebtoken');

//User Auth
module.exports.AuthUser = async(req,res,next)=>{
    const token = req.cookies.jwt_token
    if(!token){
        return res.status(401).json({
            "status":"fail",
            "message":"Not Authorized, Token not available"
        })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
          return res.status(401).json({ message: "Not authorized" })
        }
        next()
      })
    
}
