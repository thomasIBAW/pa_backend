import express from "express";
import {Family} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';

import {familySchema} from "../classes/schemas.js";
import { getCookieData, checkUserInFamily, getFamilyCheck, verifyJWTToken} from "../middlewares/middlewares.js";
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
    logger.debug("adding 'Family' as coll param to the request")
    req.params.coll = "family"
    next()
}

// Endpoint to filter by any Data (JSON) passed as payload to the request.
router.post('/find', addColl, getFamilyCheck, verifyJWTToken , checkUserInFamily, (req, res) =>{

    logger.debug("reached the new Family router...")

    const body = req.body ;

    let session_familyUuid = ""

    if (req.cookies.fc_user) {
        let authState = JSON.parse(req.cookies.fc_user)
        session_familyUuid = authState.linkedFamily ;
    }
    else if (req.headers.family_uuid) {
        session_familyUuid = req.headers.family_uuid
    }
    else {
        logger.warn(`${collection} - no family_uuid received from the query ! Aborted...`)
        return res.status(401).json({ message: 'no family_uuid received from the query ! Aborted...'})
    }


    /* adding some permission logic to the find requests. Admins will find all items, non-Admin will be limited to their family */
    if (!req.decoded.isAdmin) {
        if(req.isUserFamilyMember) {
            body.linkedFamily = session_familyUuid
        } else {
            logger.warn(`${collection} - User ${req.decoded.username} is not a familyMember! Aborted...`)
            return res.status(401).json({ message: `not a family member`})
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

// Endpoint to create a new item
router.post("/", addColl, getCookieData, verifyJWTToken, async (req, res) =>{

    logger.debug("reached the new Family router for FAmily Creation...")
    let session_familyUuid = ""

    // if (req.cookies._auth_state) {
    //     let authState = JSON.parse(req.cookies._auth_state)
    //     session_familyUuid = authState.linkedFamily ;
    // }
    // if (req.headers.family_uuid) {
    //     session_familyUuid = req.headers.family_uuid
    // }


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
        logger.error(err)
        console.log(`Error in middlewares.js, on the post item function - ${err.message}`)

        res.status(404).json(err.message)
    }

});

// Endpoint to delete an item
router.delete('/:uuid', addColl, getFamilyCheck, verifyJWTToken , checkUserInFamily, (req, res) =>{

    deleteOne(req.params.coll, req.params.uuid)
        .then((d) => {
            logger.warn(`Deleted from collection Family entry: ${req.params.uuid} by: ...tbc`)
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

})

// Endpoint to Update am item
router.patch('/:uuid', addColl, getFamilyCheck, verifyJWTToken , checkUserInFamily, (req, res) =>{
    setCollection(req.params.coll);

    if (!req.body) return res.status(404).json({ message: 'Missing body...'})

    patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

})


export default router



