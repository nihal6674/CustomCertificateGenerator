require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

const app = express();

app.use(cookieParser());
app.use(express.json()); // ✅ for JSON body
app.use(express.urlencoded({ extended: true })); // ✅ for form data

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));


app.get('/', (req, res) => {
  res.send('Server running');
});

connectDB()
  .then(() => {
    console.log('DB connected');
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
