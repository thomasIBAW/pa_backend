import {findSome} from "../connectors/dbConnector.js";
import {logger} from "./loggers.js";
import 'dotenv/config'
import jwt from "jsonwebtoken";
const secret = process.env.mySecret


export async function getFamilyCheck(req, res, next) {
 /*   this middleware checks if a family with the provided uuid, exist and returns the familyAdmins and members to next()
    the check is done only for non-user creation calls, because at the user creation time, family is not yet created*/
    console.log(req.params.coll, ' - Request has reached the "getFamilyCheck" middleware, Requested Family: ' , req.headers.family_uuid )
    if (req.params.coll !== 'users' && req.params.coll !== 'family'){
         await findSome('family', { "uuid" : `${req.headers.family_uuid}`} )
            .then( (family) => {

                if (family.length === 0) {
                    logger.warn(req.params.coll, ' - No family found. Check for "family_uuid" in the Request header')
                    return res.status(401).json(req.params.coll, ' - No family found.  Check for "family_uuid" in the Request header')
                }
                else {
                    req.family = family[0]
                    req.familyAdmin = family[0].familyAdmin;
                    req.familyMember = family[0].familyMember;
                    next()
                }
            })
            .catch((err) => {
                logger.error(err)
                console.log(req.params.coll, ' - error in middleware getFamilyCheck', req.headers.family_uuid)
                res.status(404).json(err)
            })
    } else next()
}

export async function checkUserInFamily(req, res, next) {

    /*   this middleware checks if the currently logged in user (requester) has admin rights or is member in a family*/

    console.log(req.params.coll, ' - Request has reached "checkUserInFamily" middleware')

    let isUserFamilyMember = false
    let isUserFamilyAdmin = false

    if ((req.params.coll !== "family") && (req.params.coll !== "users")) {
        isUserFamilyAdmin = req.familyAdmin.includes(req.decoded.userUuid)
        isUserFamilyMember = req.familyMember.includes(req.decoded.userUuid)
        req.isUserFamilyAdmin = isUserFamilyAdmin
        req.isUserFamilyMember = isUserFamilyMember

        next()
    } else next()
}

export async function checkDuplicates (req, res, next) {

    console.log(req.params.coll, ' - Request has reached checkDuplicates middleware')

    if (req.params.coll === 'users'){
        // console.log('reached Middleware...', req.params.coll, req.body.username)
            await findSome('users', { "username" : `${req.body.username}`} )
                .then( (user) => {
                    if (user.length === 0) {
                        next()
                    }
                    else {
                        console.log(user)
                        logger.warn('Duplicated username. Cannot create item')
                        return res.status(403).json('Duplicated username. Cannot create item')
                    }
                })
                .catch((err) => {
                    logger.error(err)
                    console.log('error in middleware checkDuplicates')

                    res.status(404).json(err)
                })
        }
    else if (req.params.coll === 'family'){

        console.log('reached Middleware...')

        await findSome('family', { "familyName" : `${req.body.familyName}`} )
            .then( (fam) => {
                if (fam.length === 0) {
                    next()
                }
                else {
                    logger.warn('Duplicated familyname. Cannot create item')
                    return res.status(403).json('Duplicated familyname. Cannot create item')
                }
            })
            .catch((err) => {
                logger.error('middlewares.js / Family /',err)
                console.log('error in middleware getFamilyCheck findSome call')
                res.status(404).json(err)
            })
        }
    else next()
}
export async function verifyJWTToken (req, res, next) {

    console.log(req.params.coll, ' - Request has reached the "verifyJWTToken" middleware')


    jwt.verify(req.headers.api_key, secret, async function(err, decoded) {
        if (err) {
            logger.error(req.params.coll, ' - middlewares.js / verifyJWTToken /,Error during token verification:', err);
            return res.status(500).json('Error during token verification.');
        }
        if (decoded) {
            //console.log('Endpoint Authenticated successful! user: ', decoded.username);
            logger.info(req.params.coll, ` - User <${decoded.username}> successfully Authenticated to endpoint`)

            //if user is not Admin, restrict to only FamilyAdmin users
            // if (!decoded.isAdmin) {
            //
            //     if (!req.familyAdmin.filter(decoded.userUuid)) {
            //         logger.error(`User ${decoded.username} is not admin.`);
            //         return res.status(401).json(`User ${decoded.username} is not admin.`);
            //     }
            // }

            //console.log(`My user uuid: ${decoded.userUuid}. All Admins in current Family are: ${req.familyAdmin}`)

            req.decoded = decoded
            next()
            // Code to be executed here:
        }
        else {
            logger.error(`User <${decoded.username}> - Authentication failed - Wrong token!`)
            res.status(401).json(`User <${decoded.username}> - Authentication failed - Wrong token!`);
        }
    })
    }