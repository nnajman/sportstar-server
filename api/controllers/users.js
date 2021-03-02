const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = {
    signup: (req, res) => {
        const { email, password, firstName, lastName, phone} = req.body;

        User.find({ email }).then((users) => {
            if (users.length >= 1) {
                return res.status(409).json({
                    message: 'Email exists'
                })
            }

            bcrypt.hash(password, 10, (error, hash) => {
                if (error) {
                    return res.status(500).json({
                        error
                    })
                }
    
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email,
                    password: hash,
                    firstName,
                    lastName,
                    phone
                })
    
                user.save().then(() => {
                    res.status(200).json({
                        message: 'User created'
                    });
                }).catch(error => {
                    res.status(500).json({
                        error
                    })
                });
            });
        })
    },
    login: (req, res) => {
        const { email, password } = req.body;
        
        User.find({ email }).then((users) => {
            if (users.length === 0) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }

            const [ user ] = users;
            
            bcrypt.compare(password, user.password, (error, result) => {
                if (error) {
                    return res.status(401).json({
                        message: 'Auth failed'
                    });
                }

                if (result) {
                    const token = jwt.sign({
                        id: user._id,
                        email: user.email,
                    },
                    process.env.JWT_USER_KEY,
                    {
                        expiresIn: "1H"
                    });
                    
                    return res.status(200).json({
                        message: 'Auth successful',
                        token
                    })
                }

                res.status(401).json({
                    message: 'Auth failed'
                });
            })
        })
    },
    getUsers: (req, res) => {
        const {email, firstName, lastName, phone} = req.query;
        let emailRegExp, firstNameRegExp, lastNameRegExp, phoneRegExp;
    
        //Check if get params and build the regex
        email ? (emailRegExp = `${email}`) : (emailRegExp = "");
        firstName ? (firstNameRegExp = `^${firstName}$`) : (firstNameRegExp = "");
        lastName ? (lastNameRegExp = `^${lastName}$`) : (lastNameRegExp = "");
        phone ? (phoneRegExp = `^${phone}$`) : (phoneRegExp = "");
    
        User.find({
          $and: [
            { email: new RegExp(emailRegExp, "i") },
            { firstName: new RegExp(firstNameRegExp, "i") },
            { lastName: new RegExp(lastNameRegExp, "i") },
            { phone: new RegExp(phoneRegExp, "i") }
          ],
        })
          .then((users) => {
            res.status(200).json({
                users,
            });
          })
          .catch((error) => {
            res.status(500).json({
              error,
            });
          });
    },
    getUser: (req, res) => {
        const userId = req.params.userId;

        User.findById(userId)
        .then((user) => {
            res.status(200).json({
            user,
            });
        })
        .catch((error) => {
            res.status(500).json({
            error,
            });
        });
    },
    updateUser: (req, res) => {
        const userId = req.params.userId;

        User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }
            User.updateOne({ _id: userId }, req.body)
            .then(() => {
                res.status(200).json({
                 message: "User Updated",
                });
            })
            .catch((error) => {
                return res.status(500).json({
                    error,
                });
            });
        })
        .catch((error) => {
            return res.status(500).json({
                error,
            });
        });
    },
    deleteUser: (req, res) => {
        const userId = req.params.userId;

        User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }
            else if (user.email == "admin@gmail.com") {
                return res.status(405).json({
                    message: "Can not delete default user",
                });
            }
           
            User.deleteOne({ _id: userId })
            .then(() => {
                return res.status(200).json({
                message: `User _id:${userId} Deleted`,
                });
            })
            .catch((error) => {
                res.status(500).json({
                error,
                });
            });
        })
        .catch((error) => {
            res.status(500).json({
            error,
            });
        });
    }
}