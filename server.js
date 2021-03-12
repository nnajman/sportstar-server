const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');

const port = process.env.PORT || 8080;
dotenv.config();

const productsRoutes = require('./api/routes/products');
const categoriesRoutes = require('./api/routes/categories');
const ordersRoutes = require('./api/routes/orders');
const usersRoutes = require('./api/routes/users');

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", 'http://localhost:3000', 'http://localhost:4200');
    // res.header('Access-Control-Allow-Credentials', true);
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
app.use('/users', usersRoutes);
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});


mongoose.connect(`mongodb+srv://${process.env.MongoDB_User}:${process.env.MongoDB_Password}@sportstar.deqis.mongodb.net/sportstar?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => {
    console.log('Connected to database');
    const server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

    const io = socketIo(server, {
        cors:{
            origins: ["http://localhost:4200", "http://localhost:3000"],
            methods: ["GET", "POST"]
        },
        
    });
    var count = 0;
    io.on('connection', (socket) => {
        console.log('new connection');
        if (socket.handshake.headers.origin === 'http://localhost:4200') {
            count++;
            socket.broadcast.emit('count', count);

            socket.on('disconnect', () => {
                count--;
                socket.broadcast.emit('count', count);
            });
        }
    });
});