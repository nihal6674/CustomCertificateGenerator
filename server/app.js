const express=require('express')
const app=express()
const connectDb=require('./config/database')


connectDb().then(
    ()=>{
        console.log("connected to database successfully")
app.listen(3000,()=>{
    console.log("server started successfully");
})
    }
).catch(()=>{
    res.status(400).send("couldnt connect to database");
})






