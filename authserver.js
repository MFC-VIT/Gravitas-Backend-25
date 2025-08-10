console.log('Running New Server')
require('dotenv').config()
const express = require('express')//importing express
const jwt = require('jsonwebtoken')//importing jsonwebtoken 
const app = express()
app.use(express.json())

let refreshTokens = []//every time server refreshes this becomes empty not a good practice


app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401)//unauthorized
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)//invalid token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)//invalid
    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
  })
})

app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)//successfully deleting token
})

app.post('/login', (req,res) =>{
    const username = req.body.username
    const user = { name: username }

    const accessToken = generateAccessToken(user)//generates accesstoken with time 1 minute
    const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push(refreshToken)//pushing the refresh token to the above empty variable
    console.log(accessToken)
    res.json({ "accesstoken" : accessToken, "refreshtoken" : refreshToken })//returns accesstoken
})

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '5m' })//expiration time 5 minute
}




app.listen(4000)//port 3000