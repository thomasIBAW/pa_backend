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
const backend = process.env.BACKEND || "unknown"  //to be set in Env variables
const devstate = process.env.DEVSTATE || "DEV" //to be set in Env variables

const router = express.Router();
const collection = "todos";

router.post('/', (req, res) => {
    //console.log(req)
    let username = req.body.username;
    let password = req.body.password;
        logger.info(`Login request from user ${username} with a password`)

        findSome('users', {"username" : username} )
            .then((user)=> {
                if (user.length === 0) {
                    logger.error(`User <${username}> not found!`)
                    return res.status(404).send('User not found.');
                }
                user = user[0];
                logger.debug(user)

                bcrypt.compare( password , user.password, function (err, result) {
                    if (err) {
                        logger.error(`An error occurred. Username Password mismatch - User: ${username} - ${err}`)
                        return res.status(500).send('An error occurred. Username Password mismatch');
                }

                if (result) {
                    logger.info(`User <${user.username}> <${user.uuid}>successfully Authenticated!`)

                    jwt.sign({
                        username: user.username,
                        remember: user.remember,
                        isAdmin: user.isAdmin,
                        isFamilyAdmin: user.isFamilyAdmin,
                        linkedPerson: user.linkedPerson,
                        userUuid: user.uuid,
                        linkedFamily: user.linkedFamily,
                        created: user.created
                    } , secret, { expiresIn: '30d' },
                    function(err, token) {
                        
                        logger.debug("signed Token... creating Cookies...")

                        // console.log(token)
                        res.cookie('fc_token', token, {
                            sameSite: 'strict',
                            httpOnly: true,
                            secure: true
                        })
                        res.cookie('fc_backend_version', {
                            version: backend,
                            running: devstate
                        }, {
                            sameSite: 'strict',
                            httpOnly: false,
                            secure: true
                        })
                        res.cookie('fc_user', 
                        JSON.stringify({
                            username: user.username,
                            remember: user.remember,
                            isAdmin: user.isAdmin,
                            isFamilyAdmin: user.isFamilyAdmin,
                            linkedPerson: user.linkedPerson,
                            userUuid: user.uuid,
                            linkedFamily: user.linkedFamily })
                        , {
                            sameSite: 'strict',
                            httpOnly: false,
                            secure: true
                        })
                        logger.debug("created ....")
                        res.status(200).json({message:"Login successfull"});
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