import express from "express";
import {write} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import jwt from 'jsonwebtoken';
import date from 'date-and-time';
import {userSchema, familySchema} from "../classes/schemas.js";
import bcrypt from "bcrypt";
import {User, Family} from "../classes/classes.js";
import 'dotenv/config'

const secret = process.env.mySecret //to be set in Env variables
const saltRounds = 10;

const router = express.Router();
const collection = "users";

router.post('/', async (req, res) => {

        let valUser = {}
        let valFamily = {}

        console.log('Received Body from the request is : ',req.body)
        const user = await userSchema.validateAsync(req.body.user);
        const fam = await familySchema.validateAsync(req.body.family);

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
        //console.log(hash)
        valUser = new User(username, hash, remember, isAdmin, isFamilyAdmin, linkedPerson, linkedFamily, created2, useremail)
        //console.log(val)


        let familyName = fam.familyName,
        familyColor = fam.familyColor || ""

        valFamily = new Family(familyName,familyColor)
        
        // Create a new user from the registration page
        const createdUser = await write(collection, valUser)
            .then(s => {
                // console.log('Item created :',s)
                console.log(`Created User is ${JSON.stringify(valUser)}`)
                logger.info(`created a new User in ${collection} by user : ${valUser.username}`);

            })          

            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)
            })
        

        console.log('userUuid is : ', createdUser.uuid)

        valFamily.familyAdmin = [createdUser.uuid]
        valFamily.familyMember = [createdUser.uuid]
        // Add uuid of the creating user to the new Item
        valFamily.createdBy = createdUser.uuid;

        // Create a new family from the registration page using uuid from the createdUser
        const createdFamily = await write("family", valFamily)
            .then( s => {
                // console.log('Item created :',s)
                console.log(`${collection} - Created Item is ${JSON.stringify(val)}`)
                logger.info(`created a new Family in ${collection} by user <${req.decoded.username}>: ${JSON.stringify(val)}`);

                // Adding a socket message to update all open pages
                // Socket updates a useless state on all connected clients on the pages identified by the collection.
                // The updated state triggers a page reload so that any new item immediately appears on the client.
                //io.to(val.linkedFamily).emit(collection, new Date());

            })
            .catch((err) => {
                logger.error(err)
                console.log(err)
                res.status  (404).json(err)})

        // Sign JWT and create Token
        jwt.sign({
            username: currentUser.username,
            remember: currentUser.remember,
            isAdmin: currentUser.isAdmin,
            isFamilyAdmin: currentUser.isFamilyAdmin,
            linkedPerson: currentUser.linkedPerson,
            userUuid: currentUser.uuid,
            linkedFamily: currentUser.linkedFamily } , secret, { expiresIn: '30d' },
             function(err, token) {
            
            console.log("signed Token... creating Cookies...")

            // console.log(token)
            res.cookie('fc_token', token, {
                sameSite: 'strict',
                httpOnly: true,
                secure: true
            })
            
            res.cookie('fc_user', 
            JSON.stringify({
                username: currentUser.username,
                remember: currentUser.remember,
                isAdmin: currentUser.isAdmin,
                isFamilyAdmin: currentUser.isFamilyAdmin,
                linkedPerson: currentUser.linkedPerson,
                userUuid: currentUser.uuid,
                linkedFamily: currentUser.linkedFamily })
            , {
                sameSite: 'strict',
                httpOnly: false,
                secure: true
            })
            console.log("created ....")
            res.status(200).json({message:"Created and Logged In..."});
        });
            
});

export default router