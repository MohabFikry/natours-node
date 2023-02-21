const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

// eslint-disable-next-line no-unused-vars
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database Connected!'));

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/tours-simple.json`, 'UTF-8')
// );
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'UTF-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'UTF-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'UTF-8')
);

const importTours = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Data Imported');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
const deleteTours = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data Deleted');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importTours();
} else if (process.argv[2] === '--delete') {
  deleteTours();
}
