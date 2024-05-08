import express from "express";
// import {write, findAll, findOne, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
// import {logger} from '../middlewares/loggers.js'
// import jwt from 'jsonwebtoken';
// import date from 'date-and-time';
// import { todoSchema } from "../classes/schemas.js";
import 'dotenv/config'
// import bcrypt from "bcrypt";

// secret needed to compare login password with the hash in the DB
// Please change the secret to any random string in the .env file
const secret = process.env.mySecret  //to be set in Env variables

const router = express.Router();

router.post('/', (req, res) => {

    {
        console.log("received logout request ... ")

        res.clearCookie('token', {
            sameSite: 'strict',
            httpOnly: true
        })
        console.log("token removed- Send code 200 ... ")

        res.status(200).json({message: 'Cookie deleted'});
    }

})

export default router