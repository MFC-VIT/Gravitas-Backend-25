console.log('Running New Server')
require('dotenv').config()
const express = require('express')//importing express
const jwt = require('jsonwebtoken')//importing jsonwebtoken 
const app = express()
app.use(express.json())

const posts = [
    {
        username: 'Piyush',
        title: 'Post 1'
    },
    {
        username: 'Abhinav',
        title: 'Post 2'
    }
]

app.get('/posts', authenticateToken,(req,res) => {
    res.json(posts.filter(post => post.username === req.user.name))//returns user info Piyush ke liye Post 1 and abhinav ke liye post 2
})


function authenticateToken(req, res, next) { // authentication middleware
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]//BEARER TOKEN
  if (token == null) return res.sendStatus(401)//unauthorized

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log(err)
    if (err) return res.sendStatus(403)//no longer valid token
    req.user = user
    next()
  })
}




app.listen(3000)//port 3000