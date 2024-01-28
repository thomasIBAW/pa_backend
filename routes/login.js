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
const secret = process.env.mySecret || "yourSecretString" //to be set in Env variables

const router = express.Router();
const collection = "todos";

router.post('/', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
        console.log(username, password)

        findSome('users', {"username" : username} )
            .then((user)=> {
                if (user.length === 0) {
                    logger.error(`User <${username}> not found!`)
                    return res.status(404).send('User not found.');
                }
                user = user[0];
                console.log(user)

                bcrypt.compare( password , user.password, function (err, result) {
                    if (err) {
                        console.error('An error occurred. Username Password mismatch:', err);
                        logger.error(`An error occurred. Username Password mismatch - User: ${username}`)
                        return res.status(500).send('An error occurred. Username Password mismatch');
                }

                if (result) {
                    console.log('Authentication successful!');
                    logger.info(`User <${user.username}> <${user.uuid}>successfully Authenticated!`)

                    jwt.sign({
                        username: user.username,
                        remember: user.remember,
                        isAdmin: user.isAdmin,
                        isFamilyAdmin: user.isFamilyAdmin,
                        linkedPerson: user.linkedPerson,
                        userUuid: user.uuid,
                        linkedFamily: user.linkedFamily } , secret, { expiresIn: '30d' },
                    function(err, token) {

                        res.status(200).send(token);
                    }
                    );

                }
                else {
                    logger.error(`User <${username}> - Authentication failed - Wrong Password!`)
                    res.status(401).send('Authentication failed.');
                }

            });

        })

})

export default router