require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/traveltek';

const PORT = process.env.PORT || 8000;

// Routes
app.use('/api', taskRoutes);

async function connectDb() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
}

// (All route handlers moved into routes/controllers)

connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });


