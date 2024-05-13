import express from "express";
import {Appointment, Family, Person, Tag, Todo, User} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';

import {calendarSchema, familySchema, personSchema, tagsSchema, todoSchema, userSchema} from "../classes/schemas.js";
import {checkDuplicates, checkUserInFamily, getFamilyCheck, identUser, verifyJWTToken} from "../middlewares/middlewares.js";
import 'dotenv/config'
import {io} from "../index.js";

const pattern = date.compile('DD.MM.YYYY')
const router = express.Router();

let collection = "users";

function addColl(req, res, next) {

    //   adding coll value because missing in family route
    console.log("adding 'users' as coll param to the request")
    req.params.coll = "users"
    next()
}

// Endpoint to filter by any Data (JSON) passed as payload to the request.

router.post('/api/:coll/find', identUser , getFamilyCheck, checkUserInFamily, (req, res) =>{

    const body = req.body

    let session_familyUuid = ""

    if (req.cookies._auth_state) {
        let authState = JSON.parse(req.cookies._auth_state)
        session_familyUuid = authState.linkedFamily ;
    }
    if (req.headers.family_uuid) {
        session_familyUuid = req.headers.family_uuid
    }


    /* adding some permission logic to the find requests. Admins will find all items, non-Admin will be limited to their family */
    if (!req.decoded.isAdmin) {
        if(req.isUserFamilyMember) {
            body.linkedFamily = session_familyUuid
        } else {
            console.log(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
            logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
            return res.status(401).json(`not a family member`)
        }
    }

    console.log(`${collection} / ${req.decoded.username} - Searching for : ${JSON.stringify(body)}`)

    findSome(collection, body)
        .then((d) => {
            logger.info(`${collection} - Received a list request from User ${req.decoded.username}`);
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })


})

// Endpoint to create a new item  -  created at signup
router.post('/api/:coll', identUser, getFamilyCheck, checkUserInFamily, checkDuplicates, async (req, res) =>{

    setCollection(req.params.coll);

    let session_familyUuid = ""

    if (req.cookies._auth_state) {
        let authState = JSON.parse(req.cookies._auth_state)
        session_familyUuid = authState.linkedFamily ;
    }
    if (req.headers.family_uuid) {
        session_familyUuid = req.headers.family_uuid
    }


    //let authState = JSON.parse(req.cookies._auth_state) || ""
    //let session_familyUuid = req.headers.family_uuid || authState.linkedFamily ;
    //
    // console.log(`
    // Details about current API call:
    // endpoint : ${req.params.coll}
    // logged in user: ${req.decoded.username}
    // (isAdmin : ${req.decoded.isAdmin})
    // (isFamilyAdmin : ${req.isUserFamilyAdmin})
    // (isFamilyMember : ${req.isUserFamilyMember})
    // Family name is : ${req.family.familyName}
    // FamilyUuid : ${session_familyUuid}
    // `)

    try {
        let val = {};

        switch (req.params.coll) {
            case 'calendar' :
                if (!req.isUserFamilyMember) {
                    console.log(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json(`not a family member`)
                }

                const calendar = await calendarSchema.validateAsync(req.body)

                console.log('Backend received calendar payload to add: ', req.body)

                let subject = calendar.subject,
                    creator = calendar.creator || "Unknown",
                    dateTimeStart = calendar.dateTimeStart,
                    dateTimeEnd = calendar.dateTimeEnd,
                    fullDay = calendar.fullDay || false ,
                    attendees = calendar.attendees || [],
                    note = calendar.note || "",
                    tags = calendar.tags || [],
                    important = calendar.important || false,
                    created = date.format(new Date(), 'YYYY-MM-DDTHH:mm')

                val = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created , tags)
                console.log('Backend passes the following to the DB connector: ', val)
                break;
            case 'people' :
                if (!req.isUserFamilyMember) {
                    console.log(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json(`not a family member`)
                }

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
            case 'tags' :

                if (!req.isUserFamilyMember) {
                    console.log(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json(`not a family member`)
                }

                const tag = await tagsSchema.validateAsync(req.body)

                let tagName = tag.tagName,
                    tagColor = tag.tagColor || ""
                val = new Tag(tagName,tagColor)
                break;
            case 'family' :
                const fam = await familySchema.validateAsync(req.body)
                // console.log( 'validates: ', fam)

                let familyName = fam.familyName,
                    familyColor = fam.familyColor || ""

                val = new Family(familyName,familyColor)

                // console.log('userUuid is : ', req.decoded.userUuid)

                val.familyAdmin = [req.decoded.userUuid]
                val.familyMember = [req.decoded.userUuid]

                break;
            case 'todos' :
                if (!req.isUserFamilyMember) {
                    console.log(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json(`not a family member`)
                }

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

            //Users to be removed ans moved to signup router ... tbc
            // case 'users' :
            //     const user = await userSchema.validateAsync(req.body);
            //     let username = user.username,
            //         useremail = user.email || "",
            //         password = user.password, //to be bcrypted
            //         remember = user.remember || false ,
            //         isAdmin = user.isAdmin || false,
            //         isFamilyAdmin = user.isFamilyAdmin || false,
            //         linkedPerson = user.linkedPerson || "",
            //         linkedFamily = user.linkedFamily || "",
            //         created2 = date.format(new Date(), 'DD.MM.YYYY HH:MM')
            //
            //     const hash = bcrypt.hashSync(password, saltRounds);
            //     console.log(hash)
            //     val = new User(username , hash, remember, isAdmin, isFamilyAdmin, linkedPerson, linkedFamily, created2 , useremail)
            //     console.log(val)
            //     break;
            case 'default' : {
                res.status(404).json(`Not existing endpoint ${req.params.coll}`)
            }
        }

        if ((req.params.coll !== "family") && (req.params.coll !== "users")) {

            if (req.cookies._auth_state) {
                let authState = JSON.parse(req.cookies._auth_state)
                val.linkedFamily = authState.linkedFamily ;
            }
            if (req.headers.family_uuid) {
                val.linkedFamily = req.headers.family_uuid
            }

        }
        val.createdBy = req.decoded.userUuid; // Add uuid of the creating user to the new Item

        await write(collection, val )
            .then( s => {
                // console.log('Item created :',s)
                console.log(`${collection} - Created Item is ${JSON.stringify(val)}`)
                logger.info(`created a new item in ${collection} by user <${req.decoded.username}>: ${JSON.stringify(val)}`);

                // Adding a socket message to update all open pages
                // Socket updates an useless state on all connected clients on the pages identified by the collection.
                // The updated state triggers a page reload so that any new item immediately appears on the client.
                io.to(val.linkedFamily).emit(collection, new Date());


                // sending result to client
                res.status(200).json(val)

            })
            .catch((err) => {
                logger.error(err)
                console.log(err)
                res.status(404).json(err)})

    }
    catch (err) {
        logger.error(err)
        console.log('Error in middlewares.js, on the post item function',err)

        res.status(404).json(err.message)
    }

});

// Endpoint to delete an item
router.delete('/api/:coll/:uuid', identUser, getFamilyCheck, checkUserInFamily,(req, res) =>{
    setCollection(req.params.coll);

    deleteOne(collection, req.params.uuid)
        .then((d) => {
            logger.warn(`Deleted from collection ${collection} entry: ${req.params.uuid} by: ...tbc`)
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

})

// Endpoint to Update am item
router.patch('/api/:coll/:uuid', identUser, checkUserInFamily,(req, res) =>{

    if (!req.body) return res.status(404).json({message:'Missing body...'})

    patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})
})


export default router



