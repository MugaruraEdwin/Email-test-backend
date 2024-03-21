import express  from 'express';
import mongoose  from "mongoose";
import nodemailer from 'nodemailer';
import cors from "cors";
import EmployeeModel from "./server/models/Employee.js";

const app = express()
app.use(express.json())
app.use(cors())
const port = process.env.PORT ||  3001;


try{
    mongoose.connect("mongodb://localhost:27017");
    console.log("Connected to the Database");


    app.get("/testing", (req, res) => {
        return res.status(200).json({message:"We are working!!"})
    })

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'mugaruraedwinmusumba@gmail.com',
            pass: 'yidp ckxj alxr ljnz'
        }
    });

    app.post('/register', (req, res) => {
        // Create new employee record
        EmployeeModel.create(req.body)
            .then(employees => {
                // Send confirmation email to the registered user
                sendConfirmationEmail(req.body.email, req.body.password);
                res.json(employees);
            })
            .catch(err => res.json(err))
    });

    function sendConfirmationEmail(email, password) {
        const mailOptions = {
            from: 'mugaruraedwinmusumba@gmail.com',
            to: email,
            subject: 'Registration Successful',
            text: `Congratulations! You have successfully been registered. Your current password is: ${password}, use this to reset your password to preferred password using http://localhost:3000/reset-password. You can then access the system with your newly registered credentials using http://localhost:3000/.`
        };
    
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }


    app.get('/data', (req, res) => {
        EmployeeModel.find()
            .then(data => {
                res.status(200).json(data);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                res.status(500).send("Error fetching data");
            });
    });
    

    app.post("/login", (req, res) => {
        const { email, password } = req.body;
        EmployeeModel.findOne({ email: email })
            .then(user => {
                if (user) {
                    if (user.password === password) {
                        res.json({ status: "Success"});
                    } else {
                        res.json("Password is incorrect");
                    }
                } else {
                    res.json("No record exists matching those credentials");
                }
            })
            .catch(err => console.log(err));
    });

    app.post("/reset-password", (req, res) => {
        const { email, currentPassword, newPassword } = req.body;
    
        // Check if the email exists and the current password matches
        EmployeeModel.findOne({ email: email, password: currentPassword })
            .then(user => {
                if (user) {
                    // Update the user's password in the database
                    user.password = newPassword;
                    user.save()
                        .then(() => {
                            res.json({ success: true, message: "Password reset successful." });
                        })
                        .catch(err => {
                            console.error("Error:", err);
                            res.status(500).json({ success: false, message: "An error occurred while updating the password." });
                        });
                } else {
                    // If user not found or current password doesn't match, return error
                    res.status(401).json({ success: false, message: "Incorrect current password or email." });
                }
            })
            .catch(err => {
                console.error("Error:", err);
                res.status(500).json({ success: false, message: "An error occurred while processing your request." });
            });
    });
    
    
    
    

    app.listen(port,() => {
        console.log(`Server is now running at http://localhost:${port}`)
    })
}catch(error){
    console.log("Error connecting to the database:",error)
}

