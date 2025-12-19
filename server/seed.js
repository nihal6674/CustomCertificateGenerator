// 'require('dotenv').config();
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const connectDB = require('./config/database');
// const User = require('./models/User');

// (async () => {
//   try {
//     await connectDB();
//     console.log('DB connected');

//     const existingAdmin = await User.findOne({ isSuperAdmin: true });
//     if (existingAdmin) {
//       console.log('Super Admin already exists');
//       process.exit(0);
//     }

//     const hashedPassword = await bcrypt.hash('admin123', 10);

//     await User.create({
//       name: 'Super Admin',
//       email: 'admin@institute.com',
//       password: hashedPassword,
//       role: 'ADMIN',
//       isSuperAdmin: true
//     });

//     console.log('Super Admin created successfully');
//     process.exit(0);
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// })();
