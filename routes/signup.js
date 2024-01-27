import express from "express";
import {write} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import jwt from 'jsonwebtoken';
import date from 'date-and-time';
import {userSchema} from "../classes/schemas.js";
import bcrypt from "bcrypt";
import {User} from "../classes/classes.js";
import 'dotenv/config'

const secret = process.env.mySecret | "yourSecretString" //to be set in Env variables
const saltRounds = 10;

const router = express.Router();
const collection = "users";

router.post('/', async (req, res) => {

        let val = {}
        console.log(req.body)
        const user = await userSchema.validateAsync(req.body);
        let username = user.username,
            useremail = user.email || "",
            password = user.password, //to be bcrypted
            remember = user.remember || false,
            isAdmin = user.isAdmin || false,
            isFamilyAdmin = user.isFamilyAdmin || false,
            linkedPerson = user.linkedPerson || "",
            linkedFamily = user.linkedFamily || "",
            created2 = date.format(new Date(), 'DD.MM.YYYY HH:MM')

        const hash = bcrypt.hashSync(password, saltRounds);
        console.log(hash)
        val = new User(username, hash, remember, isAdmin, isFamilyAdmin, linkedPerson, linkedFamily, created2, useremail)
        console.log(val)


        await write(collection, val)
            .then(s => {
                // console.log('Item created :',s)
                console.log(`Created User is ${JSON.stringify(val)}`)
                logger.info(`created a new User in ${collection} by user : ${JSON.stringify(val)}`);

                res.status(200).json(val)

            })
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)
            })


    });

export default router