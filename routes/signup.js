import express from "express";
import {findOne, findOneById, patchOne, write} from "../connectors/dbConnector.js";
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

        logger.info(`Received signup request from client - ${req.body}`)
        const user = await userSchema.validateAsync(req.body.user);
        const fam = await familySchema.validateAsync(req.body.family);



        let username = user.username,
            useremail = user.email || "",
            password = user.password, //to be bcrypted
            remember = user.remember || false,
            isAdmin = false,
            isFamilyAdmin = true,
            linkedPerson = user.linkedPerson || "",
            linkedFamily = user.linkedFamily || "",
            created2 = date.format(new Date(), 'DD.MM.YYYY HH:MM')

        
        const hash = bcrypt.hashSync(password, saltRounds);
        //console.log(hash)
        valUser = new User(username, hash, remember, isAdmin, isFamilyAdmin, linkedPerson, linkedFamily, created2, useremail)
        
        logger.debug('valUser UUID : ', valUser.uuid)


        let familyName = fam.familyName,
        familyColor = fam.familyColor || ""

        valFamily = new Family(familyName,familyColor)

        // Create a new user from the registration page
        const result = await write(collection, valUser)
            .then(async (s) => {
                // console.log('Item created :',s)
                logger.info(`created a new User in ${collection} by user : ${valUser.username}`);
                logger.debug(`Created User is ${JSON.stringify(valUser)}`)

                //const createdUser = await findOneById("users", { _id: s.insertedId });
                return secret
            })          

            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)
            })
        

        logger.debug(`The ner userUuid is : ${valUser.uuid}`)

        valFamily.familyAdmin = [valUser.uuid]
        valFamily.familyMember = [valUser.uuid]
        // Add uuid of the creating user to the new Item
        valFamily.createdBy = valUser.uuid;
        
        logger.debug(`... new Family to be created: ${valFamily}`)

        // Create a new family from the registration page using uuid from the createdUser
        const createdFamily = await write("family", valFamily)
            .then( s => {
                // console.log('Item created :',s)
                logger.info(`created a new Family in ${collection} by user <${valUser.username}>: ${JSON.stringify(valFamily)}`);
                // logger.debug(`${collection} - Created Item is ${JSON.stringify(valFamily)}`)

                // Adding a socket message to update all open pages
                // Socket updates a useless state on all connected clients on the pages identified by the collection.
                // The updated state triggers a page reload so that any new item immediately appears on the client.
                //io.to(val.linkedFamily).emit(collection, new Date());

            })
            .catch((err) => {
                logger.error(err)
                res.status  (404).json(err)})

        const updatedUser = await patchOne("users", valUser.uuid, {linkedFamily: valFamily.uuid})   
            .then( s => {
                // console.log('Item created :',s)
                logger.debug(`Users - Updated User is ${JSON.stringify(valUser)}`)
                //logger.info(`created a new Family in ${collection} by user <${valUser.username}>: ${JSON.stringify(valFamily)}`);

                // Adding a socket message to update all open pages
                // Socket updates a useless state on all connected clients on the pages identified by the collection.
                // The updated state triggers a page reload so that any new item immediately appears on the client.
                //io.to(val.linkedFamily).emit(collection, new Date());

            })
            .catch((err) => {
                logger.error(err)
                res.status  (404).json(err)}) 

        // Sign JWT and create Token
        jwt.sign({
            username: valUser.username,
            remember: valUser.remember,
            isAdmin: valUser.isAdmin,
            isFamilyAdmin: valUser.isFamilyAdmin,
            linkedPerson: valUser.linkedPerson,
            userUuid: valUser.uuid,
            linkedFamily: valFamily.uuid,
            created: valFamily.created
         } , secret, { expiresIn: '30d' },
             function(err, token) {
            
            logger.debug("signed Token... creating Cookies...")

            // console.log(token)
            res.cookie('fc_token', token, {
                sameSite: 'strict',
                httpOnly: true,
                secure: true
            })
            
            res.cookie('fc_user', 
            JSON.stringify({
                username: valUser.username,
                remember: valUser.remember,
                isAdmin: valUser.isAdmin,
                isFamilyAdmin: valUser.isFamilyAdmin,
                linkedPerson: valUser.linkedPerson,
                userUuid: valUser.uuid,
                linkedFamily: valFamily.uuid })
            , {
                sameSite: 'strict',
                httpOnly: false,
                secure: true
            })
            logger.debug("Cookies have been created ....")
            logger.info(`New user has been created and is logged in.`)
            res.status(200).json({message:"Created and Logged In..."});
        });
            
});

export default router