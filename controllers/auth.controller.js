import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
    const { phonenumber, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                phonenumber,
                email,
                password: hashedPassword,
            }
        });

        // Generate token
        const age = 1000 * 60 * 60 * 24 * 7;
        const token = jwt.sign(
            { id: newUser.id, isAdmin: false }, 
            process.env.JWT_SECRET_KEY,
            { expiresIn: age }
        );

        res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: age
    }).status(201).json({
      message: "User Registered Successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        phonenumber: newUser.phonenumber
      },
      token
    });
    
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to create user!" });
    }
};

export const login = async (req, res) => {
    const { phonenumber, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { phonenumber },
        });

        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

        const age = 1000 * 60 * 60 * 24 * 7;

        const token = jwt.sign(
            { id: user.id, isAdmin: true },
            process.env.JWT_SECRET_KEY,
            { expiresIn: age }
        );

        res.cookie("token", token, {
            httpOnly: true,
             secure: true,        
      sameSite: "None",
            maxAge: age
        }).status(200).json({  
            message: "Login Successful",
            user: { 
                id: user.id,  
                email: user.email, 
                phonenumber: user.phonenumber
            }, 
            token
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to login!" });
    }
};

export const logout = (req, res) => {
   res.clearCookie("token", {
  httpOnly: true,
  secure: true,
  sameSite: "None"
}).status(200).json({ message: "Logout Successful" });
};
