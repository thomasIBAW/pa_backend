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
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    //   adding coll value because missing in family route
    logger.debug("adding 'family' as coll param to the request", details)
    req.params.coll = "family"
    next()
}

// Endpoint to filter by any Data (JSON) passed as payload to the request.
router.post('/find', addColl, identUser , getFamilyCheck, checkUserInFamily, (req, res) =>{
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    logger.debug("reached the new Family router...", details)

    const body = req.body ;

    if (!req.isAdmin) {
        if(req.isUserFamilyMember) {
        body.uuid = req.family.uuid
        
        } else {
            logger.warn(`${collection} - User ${req.decoded.username} is not a family Member! Aborted...`, details)
            return res.status(401).json(`not a family member`)
        }
    } else {
        // add logic for Server Admins (none means no filtering restrictions)
            
    }

    logger.debug(`${collection} / ${req.decoded.username} - Searching for : ${JSON.stringify(body)}`, details)

    findSome(collection, body)
        .then((d) => {
            logger.debug(`${collection} - Received a list request from User ${req.decoded.username} `, details);
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })


})

// Endpoint to create a new item
router.post("/", addColl, identUser, async (req, res) =>{
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}


    logger.debug("reached the new Family router for FAmily Creation...", details)
    let session_familyUuid = ""

    try {
        let val = {};

        const fam = await familySchema.validateAsync(req.body)
        // console.log( 'validates: ', fam)

        let familyName = fam.familyName,
            familyColor = fam.familyColor || ""

        val = new Family(familyName,familyColor)

        logger.debug(`userUuid is : ${req.decoded.userUuid}`, details)

        val.familyAdmin = [req.decoded.userUuid]
        val.familyMember = [req.decoded.userUuid]

        // Add uuid of the creating user to the new Item
        val.createdBy = req.decoded.userUuid;

        await write(collection, val )
            .then( s => {
                // console.log('Item created :',s)
                logger.info(`created a new Family in ${collection} by user <${req.decoded.username}>: ${JSON.stringify(val)}`, details);

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
        logger.error(`Error in middlewares.js, on the post item function - ${err.message}`, details)
        res.status(404).json(err.message)
    }

});

// Endpoint to delete an item
router.delete('/:uuid', addColl, identUser, getFamilyCheck, checkUserInFamily, (req, res) =>{
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

// only Server Admins can delete Family
    if (!req.isAdmin) {

        logger.warn(`${collection} - User ${req.decoded.username} is not server Administrator! Aborted...`, details)
            return res.status(401).json({message:`not server Administrator`})
      
    } else {

        deleteOne(req.params.coll, req.params.uuid)

        .then((d) => {
            logger.warn(`Deleted from collection Family entry: ${req.params.uuid} by: ...tbc`, details)
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
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    if (!req.isAdmin) {

        if(req.isUserFamilyAdmin) {

            patchOne(collection, req.params.uuid, req.body)
            .then((d) => {
                logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `, details)
                res.status(200).json(d)})
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})

            } else {
                logger.warn(`${collection} - User ${req.decoded.username} is not a family Admin! Aborted...`, details)
                return res.status(401).json(`not a family Admin`)
            }
     
    } else {

        patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `, details)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

    }



    patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `, details)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

})


// Endpoint to add an invitation code
router.post("/code", addColl, identUser, async (req, res) =>{
    let details = {fileName:"family.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}


    logger.debug("reached the new Family router for invitationcode creation...", details)
    let session_familyUuid = ""

    try {
        let val = {};
        
        function isValidCode(code) {
            const regex = /^[A-Za-z0-9]{6}$/;
            return regex.test(code);
          } 

        if (!isValidCode(req.body.invitationCode)) {
            logger.error(`The provided InvitationCode is not valid or missing. Aborting ...`, details)
            res.status(404).json({message: `The provided InvitationCode is not valid or missing. Aborting ...`})
        }
        let filter = {}
        filter.uuid = req.body.uuid

        const familyToUpdate = await findSome("family", filter)
            .then((d) => {
                logger.debug(`${collection} - Received a list request from User ${req.decoded.username} `, details);
                return d
            })
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)
            })
         console.log(familyToUpdate[0])   

        logger.debug(`adding Invitation Code ${req.body.invitationCode} to Family ${familyToUpdate[0].familyName}`)

        if (!familyToUpdate[0].invitationCode || familyToUpdate[0].invitationCode.length === 0 ) { 
            val.invitationCode = [{code: req.body.invitationCode, createdBy: req.decoded.userUuid, dateCreated: new Date(), valid: true, usedBy: null}]
        } else {
            val.invitationCode = [...familyToUpdate[0].invitationCode,{code: req.body.invitationCode, createdBy: req.decoded.userUuid, dateCreated: new Date(), valid: true, usedBy: null}]
        }

        logger.debug(`new List of invitation codes : ${val.invitationCode}`, details)

        //TODO Add Permission Logic, that only Admin or Family Admin can issue Codes. 

        patchOne("family", familyToUpdate[0].uuid, val)
        .then((d) => {
            logger.warn(`Updated in collection "family" entry: ${familyToUpdate[0].uuid} by: ... `, details)
            
            // Adding a socket message to update all open pages
            // Socket updates a useless state on all connected clients on the pages identified by the collection.
            // The updated state triggers a page reload so that any new item immediately appears on the client.
            io.to(familyToUpdate[0].uuid).emit("family", new Date());
            
            res.status(200).json(d)})

        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

    }
    catch (err) {
        logger.error(`Error in middlewares.js, on the post item function - ${err.message}`, details)
        res.status(404).json(err.message)
    }

});

export default router



