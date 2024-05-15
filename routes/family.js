import express from "express";
import {Family} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';

import {familySchema} from "../classes/schemas.js";
import {  checkUserInFamily, getFamilyCheck, verifyJWTToken, identUser} from "../middlewares/middlewares.js";
import 'dotenv/config'
import {io} from "../index.js";

const pattern = date.compile('DD.MM.YYYY')
const router = express.Router();

let collection = "family";

// ****
//  Family Router
// ****

function addColl(req, res, next) {

    //   adding coll value because missing in family route
    logger.debug("adding 'family' as coll param to the request")
    req.params.coll = "family"
    next()
}

// Endpoint to filter by any Data (JSON) passed as payload to the request.
router.post('/find', addColl, identUser , getFamilyCheck, checkUserInFamily, (req, res) =>{

    logger.debug("reached the new Family router...")

    const body = req.body ;

    if (!req.isAdmin) {
        if(req.isUserFamilyMember) {
        body.uuid = req.family.uuid
        
        } else {
            logger.warn(`${collection} - User ${req.decoded.username} is not a family Member! Aborted...`)
            return res.status(401).json(`not a family member`)
        }
    } else {
        // add logic for Server Admins (none means no filtering restrictions)
            
    }

    logger.debug(`${collection} / ${req.decoded.username} - Searching for : ${JSON.stringify(body)}`)

    findSome(collection, body)
        .then((d) => {
            logger.debug(`${collection} - Received a list request from User ${req.decoded.username}`);
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })


})

// Endpoint to create a new item
router.post("/", addColl, identUser, async (req, res) =>{
    

    logger.debug("reached the new Family router for FAmily Creation...")
    let session_familyUuid = ""

    try {
        let val = {};

        const fam = await familySchema.validateAsync(req.body)
        // console.log( 'validates: ', fam)

        let familyName = fam.familyName,
            familyColor = fam.familyColor || ""

        val = new Family(familyName,familyColor)

        logger.debug(`userUuid is : ${req.decoded.userUuid}`)

        val.familyAdmin = [req.decoded.userUuid]
        val.familyMember = [req.decoded.userUuid]

        // Add uuid of the creating user to the new Item
        val.createdBy = req.decoded.userUuid;

        await write(collection, val )
            .then( s => {
                // console.log('Item created :',s)
                logger.info(`created a new Family in ${collection} by user <${req.decoded.username}>: ${JSON.stringify(val)}`);

                // Adding a socket message to update all open pages
                // Socket updates a useless state on all connected clients on the pages identified by the collection.
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
router.delete('/:uuid', addColl, identUser, getFamilyCheck, checkUserInFamily, (req, res) =>{

// only Server Admins can delete Family
    if (!req.isAdmin) {

        logger.warn(`${collection} - User ${req.decoded.username} is not server Administrator! Aborted...`)
            return res.status(401).json({message:`not server Administrator`})
      
    } else {

        deleteOne(req.params.coll, req.params.uuid)

        .then((d) => {
            logger.warn(`Deleted from collection Family entry: ${req.params.uuid} by: ...tbc`)
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})   
    }

    

})

// Endpoint to Update am item
router.patch('/:uuid', addColl, identUser, getFamilyCheck, checkUserInFamily, (req, res) =>{
    if (!req.body) return res.status(404).json({ message: 'Missing body...'})

    // only Server Admins can delete Family
    if (!req.isAdmin) {

        if(req.isUserFamilyAdmin) {

            patchOne(collection, req.params.uuid, req.body)
            .then((d) => {
                logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
                res.status(200).json(d)})
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})

            } else {
                logger.warn(`${collection} - User ${req.decoded.username} is not a family Admin! Aborted...`)
                return res.status(401).json(`not a family Admin`)
            }
        logger.warn(`${collection} - User ${req.decoded.username} is not a family Member! Aborted...`)
            return res.status(401).json(`not a family member`)
      
    } else {

        patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

    }



    patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

})


export default router



