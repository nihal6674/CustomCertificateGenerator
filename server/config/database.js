const mongoose=require('mongoose')

const connectDb=async()=>{
    await mongoose.connect("mongodb+srv://admin:Ojqz6mpkFWziidG6@cluster0.6mfqdtb.mongodb.net/CustomCertificateGenerator?appName=Cluster0");
}

module.exports=connectDb;