import express from "express";
import {write, findAll, findOne, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import jwt from 'jsonwebtoken';
import date from 'date-and-time';
import { todoSchema } from "../classes/schemas.js";
import 'dotenv/config'
import bcrypt from "bcrypt";

// secret needed to compare login password with the hash in the DB
// Please change the secret to any random string in the .env file
const secret = process.env.mySecret  //to be set in Env variables

const router = express.Router();
const collection = "todos";

router.post('/', (req, res) => {

    {
        res.clearCookie('token', {
            sameSite: 'strict',
            httpOnly: false
        })
        res.send({ success: true, message: 'Cookie deleted'});
    }

})

export default router