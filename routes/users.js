import express from "express";
// import {Appointment, Family, Person, Tag, Todo, User} from '../classes/classes.js';
import {write, deleteOne, patchOne, findSome} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';

// import {calendarSchema, familySchema, personSchema, tagsSchema, todoSchema, userSchema} from "../classes/schemas.js";
import {checkDuplicates, checkUserInFamily, getFamilyCheck, identUser, verifyJWTToken} from "../middlewares/middlewares.js";
import 'dotenv/config'
import {io} from "../index.js";

// const pattern = date.compile('DD.MM.YYYY')
const router = express.Router();

let collection = "users";


function addColl(req, res, next) {
    let details = {fileName:"users.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    //   adding coll value because missing in family route
    logger.debug("adding 'users' as coll param to the request", details)
    req.params.coll = "users"
    next()
}

// Endpoint to filter by any Data (JSON) passed as payload to the request.

router.post('/find', identUser , addColl, getFamilyCheck, checkUserInFamily, (req, res) =>{
    let details = {fileName:"users.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    const body = req.body

    let session_familyUuid = ""

    if (!req.isAdmin) {

        if(req.isUserFamilyAdmin) {

            body.linkedFamily = req.Family.uuid

            findSome(collection, body)
            .then((d) => {
                logger.debug(`${collection} - Received a list request from User ${req.decoded.username}`, details);
                res.status(200).json(d)
            })
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)
            })
     
    } else {

        findSome(collection, body)
        .then((d) => {
            logger.debug(`${collection} - Received a list request from User ${req.decoded.username}`, details);
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })

    }

    }
})

// Endpoint to create a new item  -  created at signup
router.post('/', identUser, addColl, getFamilyCheck, checkUserInFamily, checkDuplicates, async (req, res) =>{
    let details = {fileName:"users.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    if (!req.isAdmin) {
         
        logger.warn(`${collection} - User ${req.decoded.username} is not a server Admin! Aborted...`, details)
        return res.status(401).json({message:`not a server Admin`})
     
    } else {

        logger.warn(`${collection} - user creation is not possible yet..`, details)
        return res.status(401).json({message:`user createion is not possible yet.`})

    }
            
});

// Endpoint to delete an item
router.delete('/:uuid', identUser, addColl, getFamilyCheck, checkUserInFamily,(req, res) =>{
    let details = {fileName:"users.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    if (!req.isAdmin) {
         
        logger.warn(`${collection} - User ${req.decoded.username} is not a server Admin! Aborted...`, details)
        return res.status(401).json({message:`not a server Admin`})
     
    } else {

        deleteOne(collection, req.params.uuid)
        .then((d) => {
            logger.warn(`Deleted from collection ${collection} entry: ${req.params.uuid} by: ...tbc`, details)
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

    }
    

})

// Endpoint to Update am item
router.patch('/:uuid', identUser, addColl, checkUserInFamily,(req, res) =>{
    let details = {fileName:"users.js", isAdmin: req.isAdmin, isUserFamilyAdmin: req.isUserFamilyAdmin, isUserFamilyMember:req.isUserFamilyMember}

    if (!req.body) return res.status(404).json({message:'Missing body...'})

    if (!req.isAdmin) {
        
        if (req.decoded.uuid === req.params.uuid)  {

            patchOne(collection, req.params.uuid, req.body)
            .then((d) => {
                logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `, details)
                res.status(200).json(d)})
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})

        } else {

            logger.warn(`${collection} - User ${req.decoded.username} is not allowed to modify user! Aborted...`, details)
            return res.status(401).json({message:`not allowed to modify user`})
        }





     
    } else {

        patchOne(collection, req.params.uuid, req.body)
        .then((d) => {
            logger.warn(`Updated in collection ${collection} entry: ${req.params.uuid} by: ... `)
            res.status(200).json(d)})
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)})

    }


    
})


export default router



