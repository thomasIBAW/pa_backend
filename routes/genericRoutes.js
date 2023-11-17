import express from "express";
import {Appointment, Person, Tag, Todo, User} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
const secret = "yourSecretString"  // to be removed!
import { calendarSchema, personSchema, tagsSchema, todoSchema , userSchema} from "../classes/schemas.js";

const saltRounds = 10;
const router = express.Router();
let collection = "";

function setCollection(x) {
        console.log(x)
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
        }
    }

// Endpoint to filter by any Data as array
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
            if (!decoded.isAdmin) body.linkedFamily = decoded.linkedFamily;

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

router.post('/api/:coll', async (req, res) =>{
    setCollection(req.params.coll);

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
                break;
            case ('tags') :
                const tag = await tagsSchema.validateAsync(req.body)

                let tagName = tag.tagName,
                    tagColor = tag.tagColor || ""

                val = new Tag(tagName,tagColor)

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

        await write(collection, val )
            .then( s => {
                console.log(s)
                logger.info(`created a new user ${JSON.stringify({s, val})}`);

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

    }
    
)

router.delete('/api/:coll/:uuid', (req, res) =>{
    setCollection(req.params.coll);

    deleteOne(collection, req.params.uuid)
    .then((d) => {
        logger.info(`Deleted appointment ${req.params.uuid}`)
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.patch('/api/:coll/:uuid', (req, res) =>{
    setCollection(req.params.coll);

    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => {
        logger.info(`Updted appointment ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})




export default router



