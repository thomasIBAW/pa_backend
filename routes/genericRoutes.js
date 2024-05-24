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

// Endpoint to filter by any Data (JSON) passed as payload to the request.
router.post('/api/:coll/find', identUser, getFamilyCheck, checkUserInFamily, (req, res) =>{
    setCollection(req.params.coll);
    const body = req.body

     /* adding some permission logic to the find requests. Admins will find all items, non-Admin will be limited to their family 
     Correction : as per now, also admin will only find family related items.
     */

    if (!req.isAdmin) {
        if(req.isUserFamilyMember) {
        body.linkedFamily = req.family.uuid
        } else {
            logger.warn(`${collection} - User ${req.decoded.username} is not a family Member! Aborted...`)
            return res.status(401).json(`not a family member`)
        }
    } else {
        if(req.isUserFamilyMember) {
            body.linkedFamily = req.family.uuid
            } else {
                logger.warn(`${collection} - User ${req.decoded.username} is not a family Member! Aborted...`)
                return res.status(401).json(`not a family member`)
            }
    }

    logger.debug(`${collection} / ${req.decoded.username} - Searching for : ${JSON.stringify(body)}`)

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

// Endpoint to create a new item
router.post('/api/:coll', identUser, getFamilyCheck, checkUserInFamily,  async (req, res) =>{
    setCollection(req.params.coll);

    logger.debug(`Reached GenericRouter for Creating ${collection}`)

    let session_familyUuid = req.family.uuid

    let userId = req.decoded.username

 
    try {
        let val = {};

        switch (req.params.coll) {
            case 'calendar' :
                if (!req.isUserFamilyMember) {
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json({message:`not a family member`})
                }
                try {
                    const calendar = await calendarSchema.validateAsync(req.body)

                    logger.info('Backend received calendar payload to add: ', req.body)

                    let subject = calendar.subject,
                        creator = userId || "Unknown",
                        dateTimeStart = calendar.dateTimeStart,
                        dateTimeEnd = calendar.dateTimeEnd,
                        fullDay = calendar.fullDay || false ,
                        attendees = calendar.attendees || [],
                        note = calendar.note || "",
                        tags = calendar.tags || [],
                        important = calendar.important || false,
                        created = date.format(new Date(), 'YYYY-MM-DDTHH:mm')

                    val = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created , tags)
                    logger.debug(`Backend passes the following Appointment to the DB connector: ${val}`)
                } catch (error) {
                    logger.error(`${collection} - ${error.message}`)
                    return res.status(403).json({message: error.message})
                }
                break;

            case 'people' :
                if (!req.isUserFamilyMember) {
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json({message:`not a family member`})
                }
                try {
                    let person = await personSchema.validateAsync(req.body)

                    let firstName = person.firstName,
                        lastName = person.lastName || "",
                        nickName = person.nickName || person.firstName,
                        dob = date.format(new Date(person.dob), pattern) || "",
                        email = person.email || ""

                    val = new Person(firstName, lastName, nickName, dob, email)
                } catch (error) {
                    logger.error(`${collection} - ${error.message}`)
                    return res.status(403).json({message: error.message})
                }
                break;

            case 'tags' :
                if (!req.isUserFamilyMember) {
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json({message:`not a family member`})
                }
                try {
                    const tag = await tagsSchema.validateAsync(req.body)

                    let tagName = tag.tagName,
                        tagColor = tag.tagColor || ""
                    val = new Tag(tagName,tagColor)


                } catch (error) {
                    logger.error(`${collection} - ${error.message}`)
                    return res.status(403).json({message: error.message})
                }

                break;

            case 'family' :
                try {
                const fam = await familySchema.validateAsync(req.body)
                // console.log( 'validates: ', fam)

                let familyName = fam.familyName,
                    familyColor = fam.familyColor || ""

                val = new Family(familyName,familyColor)
                
                // console.log('userUuid is : ', req.decoded.userUuid)

                val.familyAdmin = [req.decoded.userUuid]
                val.familyMember = [req.decoded.userUuid]
            } catch (error) {
                logger.error(`${collection} - ${error.message}`)
                return res.status(403).json({message: error.message})
            }
                break;
                
            case 'todos' :
                if (!req.isUserFamilyMember) {
                    logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
                    return res.status(401).json(`not a family member`)
                }

                try {
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

         } catch (error) {
                logger.error(`${collection} - ${error.message}`)
                return res.status(403).json({message: error.message})
            }

                break;

            case 'default' : {
                res.status(404).json({message:`Not existing endpoint ${req.params.coll}`})
            }
        }

        if ((req.params.coll !== "family") && (req.params.coll !== "users")) {
                 val.linkedFamily = req.family.uuid
                }

        val.createdBy = req.decoded.userUuid; // Add uuid of the creating user to the new Item

        await write(collection, val )
            .then( s => {
                // console.log('Item created :',s)
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
                res.status(404).json(err)})

        }
    catch (err) {
        logger.error(`Error in middlewares.js, on the post item function - ${err.message}`)
        res.status(404).json(err.message)
    }
});

// Endpoint to delete an item
router.delete('/api/:coll/:uuid', identUser, getFamilyCheck, checkUserInFamily,(req, res) =>{
    setCollection(req.params.coll);

    if (!req.body) return res.status(404).json({message:'Missing body...'})
    let body = {uuid : req.params.uuid}

    if (req.isAdmin) {
        // Add logic for Server Admin (can remove every appoointment)
                logger.debug("SERVER ADMIN - start delete process...")
                deleteOne(collection, req.params.uuid)
                .then((d) => {
                    logger.warn(`User ${req.decoded.username} has deleted from collection ${collection} entry: ${req.params.uuid}`)

                    // Adding a socket message to update all open pages
                    // Socket updates an useless state on all connected clients on the pages identified by the collection.
                    // The updated state triggers a page reload so that any new item immediately appears on the client.
                    io.to(req.family.uuid).emit(collection, new Date());

                    res.status(200).json(d)
                })
                .catch((err) => {
                    logger.error(err)
                    res.status(404).json(err)})
            

    } else if (req.isUserFamilyAdmin) {
        // Add Logic for Family Admin (Can remove all family rel. Appoitnments)
        findSome(collection, {uuid:req.params.uuid})
        .then((d) => {
            //check if requestingf user is in family Admin list: 
            if (d[0].linkedFamily !== req.family.uuid) {
                logger.warn(`User ${req.decoded.username} has no permission to delete item (not in Family) `)
                res.status(401).json({message: `User ${req.decoded.username} has no permission to delete item `})
            } else {
                logger.debug("FAMILY ADMIN - start delete process...")
                deleteOne(collection, req.params.uuid)
                .then((d) => {
                    logger.warn(`User ${req.decoded.username} has deleted from collection ${collection} entry: ${req.params.uuid}`)
                    // Adding a socket message to update all open pages
                    // Socket updates an useless state on all connected clients on the pages identified by the collection.
                    // The updated state triggers a page reload so that any new item immediately appears on the client.
                    io.to(req.family.uuid).emit(collection, new Date());
                    res.status(200).json(d)
                })
                .catch((err) => {
                    logger.error(err)
                    res.status(404).json(err)})
            }
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
    })

    } else if (req.isUserFamilyMember) {
        // Add Logic for Family Members (can remove only own appointments)
      
        findSome(collection, {uuid:req.params.uuid})

        .then((d) => {
  
            if (d[0].createdBy !== req.decoded.userUuid) {
                logger.warn(`User ${req.decoded.username} has no permission to delete item `)
                res.status(401).json({message: `User ${req.decoded.username} has no permission to delete item `})
            } 
            else {
                logger.debug("start delete process...")
                deleteOne(collection, req.params.uuid)
                .then((d) => {
                    logger.warn(`User ${req.decoded.username} has deleted from collection ${collection} entry: ${req.params.uuid}`)
                    // Adding a socket message to update all open pages
                    // Socket updates an useless state on all connected clients on the pages identified by the collection.
                    // The updated state triggers a page reload so that any new item immediately appears on the client.
                    io.to(req.family.uuid).emit(collection, new Date());                    
                    res.status(200).json(d)
                })
                .catch((err) => {
                    logger.error(err)
                    res.status(404).json(err)})
            }
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })
    } else {
        logger.warn(`User ${req.decoded.username} has no permission to delete item `)
        res.status(401).json({message: `User ${req.decoded.username} has no permission to delete item `})
    }
})

// Endpoint to Update am item
router.patch('/api/:coll/:uuid', identUser, getFamilyCheck, checkUserInFamily,(req, res) =>{
    setCollection(req.params.coll);

    if (!req.body) return res.status(404).json({message:'Missing body...'})


    if (req.isAdmin) {
        // Add logic for Server Admin (can remove every appoointment)
                logger.debug("SERVER ADMIN - start patch process...")
                patchOne(collection, req.params.uuid, req.body)
                    .then((d) => {
                        logger.info(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
                        // Adding a socket message to update all open pages
                        // Socket updates an useless state on all connected clients on the pages identified by the collection.
                        // The updated state triggers a page reload so that any new item immediately appears on the client.
                        io.to(req.family.uuid).emit(collection, new Date());
                        res.status(200).json({message:d})})
                    .catch((err) => {
                        logger.error(err)
                        res.status(404).json(err)})
            

    } else if (req.isUserFamilyAdmin) {
        // Add Logic for Family Admin (Can remove all family rel. Appoitnments)
        findSome(collection, {uuid:req.params.uuid})
        .then((d) => {
        //check if requestingf user is in family Admin list: 
        if (d[0].linkedFamily !== req.family.uuid) {
            logger.warn(`User ${req.decoded.username} has no permission to delete item (not in Family) `)
            res.status(401).json({message: `User ${req.decoded.username} has no permission to delete item `})
        } else {
            logger.debug("FAMILY ADMIN - start patch process...")
                patchOne(collection, req.params.uuid, req.body)
                    .then((d) => {
                        logger.info(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
                        // Adding a socket message to update all open pages
                        // Socket updates an useless state on all connected clients on the pages identified by the collection.
                        // The updated state triggers a page reload so that any new item immediately appears on the client.
                        io.to(req.family.uuid).emit(collection, new Date());
                        res.status(200).json({message:d})})
                    .catch((err) => {
                        logger.error(err)
                        res.status(404).json(err)})
        }
    }).catch((err) => {
        logger.error(err)
        res.status(404).json(err)
    })

    } else if (req.isUserFamilyMember) {
        // Add Logic for Family Members (can remove only own appointments)
      
        findSome(collection, {uuid:req.params.uuid})

        .then((d) => {
            // logger.debug(`${collection} - dev_ list request from User ${req.decoded.username}`);
            // logger.debug(`uuid= ${d[0].uuid} CreatedBy = ${d[0].createdBy} - current User = ${req.decoded.userUuid}`)

            if (d[0].createdBy !== req.decoded.userUuid) {
                logger.warn(`User ${req.decoded.username} has no permission to modify item `)
                res.status(401).json({message: `User ${req.decoded.username} has no permission to modify item `})
            } 
            else {
                logger.debug("start patch process...")
                patchOne(collection, req.params.uuid, req.body)
                    .then((d) => {
                        logger.info(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
                        // Adding a socket message to update all open pages
                        // Socket updates an useless state on all connected clients on the pages identified by the collection.
                        // The updated state triggers a page reload so that any new item immediately appears on the client.
                        io.to(req.family.uuid).emit(collection, new Date());
                        res.status(200).json({message:d})})
                    .catch((err) => {
                        logger.error(err)
                        res.status(404).json(err)})
            }
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })
    } else {
        logger.warn(`User ${req.decoded.username} has no permission to delete item `)
        res.status(401).json({message: `User ${req.decoded.username} has no permission to delete item `})
    }

    
})

export default router



