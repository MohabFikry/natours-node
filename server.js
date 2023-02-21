const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

dotenv.config({ path: `${__dirname}/config.env` });

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

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Listening on ${port}..`);
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
