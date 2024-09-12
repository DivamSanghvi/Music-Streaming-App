// Import necessary modules and packages
const Token = require('./models/tokenModel');
const jwt = require("jsonwebtoken");
const catchAsync = require("./utils/catchAsync");

// Function to generate a JWT token for a user and set it in a cookie
const generatejwt = async (id) => {
    const token = jwt.sign(
        { id },
        process.env.TOKEN_KEY,
        {
            expiresIn: "2h",
        }
    );

    // Create a new Token record in the database
    const tokenRecord = new Token({ token });
    await tokenRecord.save();

    return token;
};

// Function to clear the "token" cookie on the client side
const clearTokenCookie = (res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
};

// Function to log out the user
const logout = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(200).json({ message: "Logged out successfully" });
        }

        // Delete the token from the database (if it exists)
        await Token.findOneAndDelete({ token });

        // Clear the token cookie on the client side
        clearTokenCookie(res);

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const verifyToken = catchAsync(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "You are not Authenticated" });

    try {
        const authData = jwt.verify(token, process.env.TOKEN_KEY);

        return res.status(200).json({
            status: "success",
            data: { authData },
        });

    } catch (error) {
        return res.status(401).json({
            status: "failure",
            data: { error: error.message },
        });
    }
});

// Middleware function to verify the JWT token from a cookie and authenticate the user
const verifyjwt = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        // Check if the token exists in the database
        const tokenRecord = await Token.findOne({ token });

        if (!tokenRecord) {
            return res.status(401).json({ message: "You are not logged in. Please log in." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", error: error.message });
    }
};

module.exports = { generatejwt, verifyjwt, logout, verifyToken };