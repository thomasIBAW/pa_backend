import express from "express";
import {Appointment, Family, Person, Tag, Todo, User} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';
import bcrypt from "bcrypt";
import jwt, {decode} from 'jsonwebtoken';
const secret = "yourSecretString"  // to be removed!
const pattern = date.compile('DD.MM.YYYY')

import {calendarSchema, familySchema, personSchema, tagsSchema, todoSchema, userSchema} from "../classes/schemas.js";
import {Collection} from "mongodb";
import {getFamilyCheck, verifyJWTToken} from "../middlewares/middlewares.js";

const saltRounds = 10;
const router = express.Router();
let collection = "";

function setCollection(x) {
        switch (x) {
            case ('calendar') :
                collection = 'appointments';
                break;
            case ('people') :
                collection = 'people';
                break;
            case ('tags') :
                collection = 'tags';
                break;
            case ('todos') :
                collection = 'todos';
                break;
            case ('users') :
                collection = 'users';
                break;
            case ('family') :
                collection = 'family';
                break;
        }
    }

// Endpoint to filter by any Data (JSON)
router.post('/api/:coll/find', (req, res) =>{
    setCollection(req.params.coll);
    const body = req.body
    const token = req.headers.api_key

    jwt.verify(token, secret, function(err, decoded) {
        if (err) {
            logger.error('Error during token verification:', err);
            return res.status(500).json('Error during token verification.');
        }
        if (decoded) {
            console.log('Endpoint Authenticated successful! user: ', decoded.username);
            logger.info(`User <${decoded.username}> successfully Authenticated to endpoint`)

            //if user is not Admin, restrict search to only Familyrelated results
            if (!decoded.isAdmin) {
                if(decoded.linkedFamily) body.linkedFamily = decoded.linkedFamily
                body.createdBy = decoded.createdBy
            }

            console.log(body)

            findSome(collection, body)
                .then((d) => {
                    logger.info('Received a list request for appointments');
                    res.status(200).json(d)
                })
                .catch((err) => {
                    logger.error(err)
                    res.status(404).json(err)
                })

        }
        else {
            logger.error(`User <${username}> - Authentication failed - Wrong token!`)
            res.status(401).json('Authentication failed.');
        }
    });
})

// Endpoint to create a new item
router.post('/api/:coll', getFamilyCheck, verifyJWTToken, async (req, res) =>{

    setCollection(req.params.coll);

    const body = req.body
    const session_familyUuid = req.headers.family_uuid
    let isUserFamilyAdmin = req.familyAdmin.includes(req.decoded.userUuid)

    // if (req.familyAdmin.filter(decoded.userUuid)) {
    //     logger.error(`User ${decoded.username} is not admin.`);
    //     return res.status(401).json(`User ${decoded.username} is not admin.`);
    // }

    // jwt.verify(req.headers.api_key, secret, async function(err, decoded) {
    //     if (err) {
    //         logger.error('Error during token verification:', err);
    //         return res.status(500).json('Error during token verification.');
    //     }
    //     if (decoded) {
    //         console.log('Endpoint Authenticated successful! user: ', decoded.username);
    //         logger.info(`User <${decoded.username}> successfully Authenticated to endpoint`)
    //
    //         //if user is not Admin, restrict to only FamilyAdmin users
    //         if (!decoded.isAdmin) {
    //             console.log(foundFamily, foundFamilyAdmins)
    //             if (!foundFamilyAdmins.filter(decoded.userUuid)) {
    //                 logger.error(`User ${decoded.username} is not admin in ${foundFamily.familyName}`);
    //                 return res.status(401).json(`User ${decoded.username} is not admin in ${foundFamily.familyName}`);
    //             }
    //         }
    //         console.log(`My user uuid: ${decoded.userUuid}. All Admins in Family ${req.headers.family_uuid} (${foundFamily.familyName}) are: ${JSON.stringify(foundFamily.familyAdmin)}`)
    //         // Code to be executed here:

    console.log(`Family Admins for the current Family are: ${req.familyAdmin}`)
    console.log(`Currently Authenticated user is ${req.decoded.username} (isAdmin=${req.decoded.isAdmin}) / (isFamilyAdmin= ${isUserFamilyAdmin})`)

    console.log('received Body',body, ' for collection: ', collection)

            try {
                let val = {};
                switch (req.params.coll) {
                    case ('calendar') :
                        const calendar = await calendarSchema.validateAsync(req.body)

                        let subject = calendar.subject,
                            creator = calendar.creator || "Unknown",
                            dateTimeStart = calendar.dateTimeStart,
                            dateTimeEnd = calendar.dateTimeEnd,
                            fullDay = calendar.fullDay || false ,
                            attendees = calendar.attendees || [],
                            note = calendar.note || "",
                            tags = calendar.tags || [],
                            important = calendar.important || false,
                            created = date.format(new Date(), 'DD.MM.YYYY HH:MM')

                        val = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created , tags)

                        break;
                    case ('people') :
                        let person = await personSchema.validateAsync(req.body)

                        let firstName = person.firstName,
                            lastName = person.lastName || "",
                            nickName = person.nickName || value.firstName,
                            dob = date.format(new Date(person.dob), pattern) || "",
                            email = person.email || ""

                        val = new Person(firstName, lastName, nickName, dob, email)

                        //Add current family to Persona
                        val.linkedFamily = session_familyUuid

                        // if (!decoded.isAdmin && !decoded.isFamilyAdmin) {
                        //     logger.error('Not an Admin. Cannot create persona')
                        //     return res.status(401).json('Not an Admin. Cannot create persona')
                        // }
                        break;
                    case ('tags') :
                        const tag = await tagsSchema.validateAsync(req.body)

                        let tagName = tag.tagName,
                            tagColor = tag.tagColor || ""

                        val = new Tag(tagName,tagColor)

                        break;
                    case ('family') :
                        const fam = await familySchema.validateAsync(req.body)
                        // console.log( 'validates: ', fam)

                        let familyName = fam.familyName,
                            familyColor = fam.familyColor || ""

                        val = new Family(familyName,familyColor)

                        val.familyAdmin = [decoded.userUuid]
                        val.familyMember = [decoded.userUuid]

                        break;
                    case ('todos') :

                        const to = await todoSchema.validateAsync(req.body);

                        let subject1 = to.subject,
                            creator1 = to.creator || "Unknown",
                            deadline1 = to.deadline,
                            fullDay1 = to.fullDay || false ,
                            attendees1 = to.attendees || [],
                            note1 = to.note || "",
                            tags1 = to.tags || [],
                            important1 = to.important || false,
                            created1 = date.format(new Date(), 'DD.MM.YYYY HH:MM')

                        val = new Todo(subject1, creator1, deadline1, fullDay1, attendees1, note1, important1,created1 , tags1)



                        break;
                    case ('users') :
                        const user = await userSchema.validateAsync(req.body);
                        let username = user.username,
                            useremail = user.email || "",
                            password = user.password, //to by bcrypted
                            remember = user.remember || false ,
                            isAdmin = user.isAdmin || false,
                            isFamilyAdmin = user.isFamilyAdmin || false,
                            linkedPerson = user.linkedPerson || "",
                            linkedFamily = user.linkedFamily || "",
                            created2 = date.format(new Date(), 'DD.MM.YYYY HH:MM')

                        const hash = bcrypt.hashSync(password, saltRounds);
                        console.log(hash)
                        val = new User(username , hash, remember, isAdmin, isFamilyAdmin, linkedPerson, linkedFamily, created2 , useremail)
                        console.log(val)
                        break;
                }

                val.createdBy = req.decoded.userUuid; // Add uuid of the creating user to the new Item

                await write(collection, val )
                    .then( s => {
                        console.log(s)
                        logger.info(`created a new item in ${collection} by user <${decoded.username}>: ${JSON.stringify(val)}`);

                        res.status(200).json({s, val})

                    })
                    .catch((err) => {
                        logger.error(err)
                        res.status(404).json(err)})

            }

            catch  (err) {
                logger.error(err)
                res.status(404).json(err.message)
            }

            // end of the code to be executed

        // else {
        //     logger.error(`User <${decoded.username}> - Authentication failed - Wrong token!`)
        //     res.status(401).json(`User <${decoded.username}> - Authentication failed - Wrong token!`);
        // }


});

// Endpoint to delete an item
router.delete('/api/:coll/:uuid', (req, res) =>{
    setCollection(req.params.coll);

    deleteOne(collection, req.params.uuid)
    .then((d) => {
        logger.warning(`Deleted from collection ${collection} entry: ${req.params.uuid} by: ...tbc`)
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

// Endpoint to Update am item
router.patch('/api/:coll/:uuid', (req, res) =>{
    setCollection(req.params.coll);

    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => {
        logger.warning(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})


export default router



