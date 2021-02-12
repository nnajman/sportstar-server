const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const port = process.env.PORT || 8080;
const app = express();
const cors = require('cors');
app.use(cors());

const productsRoutes = require('./api/routes/products');
const categoriesRoutes = require('./api/routes/categories');
const ordersRoutes = require('./api/routes/orders');
//const usersRoutes = require('./api/routes/users');

app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

// Routes
app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/orders', ordersRoutes);
//app.use('/users', usersRoutes);

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})


mongoose.connect(`mongodb+srv://${process.env.MongoDB_User}:${process.env.MongoDB_Password}@sportstar.deqis.mongodb.net/sportstar?retryWrites=true&w=majority`,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
.then(() => {
  console.log('Connected to database');
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});