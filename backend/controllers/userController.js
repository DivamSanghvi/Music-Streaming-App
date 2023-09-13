const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const saltRounds = 10;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(saltRounds);
        const encryptedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: encryptedPassword
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Error registering user: ', error);
        res.status(500).json({ message: 'Registration failed' });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'User Not Found' });
        }

        const check = bcrypt.compare(password, user.password);
        if(!check){
            return res.status(401).json({ message: 'Wrong Passed Given'});
        }

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );

        const tokenRecord = new Token({ token });
        await tokenRecord.save();
        // console.log(token);
        res.cookie("token",token);
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error Login User: ', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

exports.profile = async (req, res) => {

};

exports.updateProfile = async (req, res) => {

};