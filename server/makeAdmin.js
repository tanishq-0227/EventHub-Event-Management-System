const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || "YOUR_MONGO_URI_HERE";


const makeAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    const res = await User.updateOne(
      { email: 'tanishq2800@gmail.com' },
      { $set: { role: 'admin' } }
    );
    
    console.log(`Updated user:`, res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

makeAdmin(); // Run this file with `node makeAdmin.js` to update the user role to admin.