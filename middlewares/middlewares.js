import {findSome} from "../connectors/dbConnector.js";
import {logger} from "./loggers.js";
import 'dotenv/config'
import jwt from "jsonwebtoken";
const secret = process.env.mySecret
import cookieParser from "cookie-parser";


let currentFamily = {}
let currentApiKey = ""

export async function getFamilyCheck(req, res, next) {

    //console.log("get FamilyCheck - Request body received: ",req.body)
    // console.log("Cookies: ", req.cookies)
    // console.log("header: ", req.headers)

    // checks if family uuid comes from Header or Cookie
    if (!req.headers.family_uuid) {
        if (!req.cookies._auth_state) {
            console.log(`${req.params.coll} - getFamilyCheck - no family_uuid received from the query ! Aborted...`)
            logger.error(`${req.params.coll} - getFamilyCheck - no family_uuid received from the query ! Aborted...`)
            return res.status(401).json({ message:`${req.params.coll} - No family found.  Check for "family_uuid" in the Request header`})
            //throw new Error("- getFamilyCheck - no family_uuid received from the query ! Aborted...")
        }
        else {
            // if cookie exists:
            currentFamily = JSON.parse(req.cookies._auth_state)
            //console.log("Request user from Cookie: ", JSON.parse(req.cookies._auth_state))
        }
    } else {
        currentFamily.linkedFamily = req.headers.family_uuid
        // console.log("Request family from Header: ", req.headers.family_uuid)
    }

    // checks if api_key comes from Header or Cookie
    if (!req.headers.api_key) {
        if (!req.cookies._auth) {
            console.log(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
            logger.error(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
            return res.status(401).json({ message:`${req.params.coll} - No ApiKey found.  Check for "api_key" in the Request header`})
        }
        else {
            // if cookie exists:
            currentApiKey = req.cookies._auth
        }
    } else {
        currentApiKey = req.headers.api_key
    }


    /*   this middleware checks if a family with the provided uuid, exist and returns the familyAdmins and members to next()
    the check is done only for non-user creation calls, because at the user creation time, family is not yet created */

    console.log(req.params.coll, ' - Request has reached the "getFamilyCheck" middleware, Requested Family: ' , currentFamily.linkedFamily )


    if (req.params.coll !== 'users'){
         await findSome('family', { "uuid" : `${currentFamily.linkedFamily}`} )
            .then( (family) => {

                if (family.length === 0) {
                    logger.warn(req.params.coll, ' - getFamilyCheck - No family found. Check for "family_uuid" in the Request header')
                    res.status(401).json(req.params.coll, ' - getFamilyCheck - No family found.  Check for "family_uuid" in the Request header')
                }
                else {
                    req.family = family[0]
                    req.familyAdmin = family[0].familyAdmin;
                    req.familyMember = family[0].familyMember;
                    req.token = currentApiKey
                    console.log('getFamilyCheck successful')
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

    if (req.params.coll !== "users") {
        isUserFamilyAdmin = req.familyAdmin.includes(req.decoded.userUuid)
        isUserFamilyMember = req.familyMember.includes(req.decoded.userUuid)
        req.isUserFamilyAdmin = isUserFamilyAdmin
        req.isUserFamilyMember = isUserFamilyMember
        console.log('checkUserInFamily successful')
        next()
    }
    else next()
}

export async function checkDuplicates (req, res, next) {

    console.log(req.params.coll, ' - Request has reached checkDuplicates middleware')

    if (req.params.coll === 'users'){
        // console.log('reached Middleware...', req.params.coll, req.body.username)
            await findSome('users', { "username" : `${req.body.username}`} )
                .then( (user) => {
                    if (user.length === 0) {
                        console.log('checkDuplicates successful')
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
                    logger.warn('Duplicated family name. Cannot create item')
                    return res.status(403).json({ message: 'Duplicated family name. Cannot create item'})
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

    if (!req.token) {
        // checks if api_key comes from Header or Cookie
        if (!req.headers.api_key) {
            if (!req.cookies._auth) {
                console.log(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
                logger.error(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
                return res.status(401).json({ message:`${req.params.coll} - No ApiKey found.  Check for "api_key" in the Request header`})
            }
            else {
                // if cookie exists:
                req.token = req.cookies._auth
            }
        } else {
            req.token = req.headers.api_key
        }
    }

    console.log(req.params.coll, ' - Request has reached the "verifyJWTToken" middleware')

    jwt.verify(req.token, secret, async function(err, decoded) {
        if (err) {
            logger.error(req.params.coll, ' - middlewares.js / verifyJWTToken /,Error during token verification:', err);
            console.log(req.params.coll, ' - middlewares.js / verifyJWTToken /,Error during token verification:', err);
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

            console.log(`My user uuid: ${decoded.userUuid}. All Admins in current Family are: ${req.familyAdmin}`)

            req.decoded = decoded
            console.log('verifyJWTToken successful')
            next()
            // Code to be executed here:
        }
        else {
            logger.error(`User <${decoded.username}> - Authentication failed - Wrong token!`)
            res.status(401).json(`User <${decoded.username}> - Authentication failed - Wrong token!`);
        }
    })
    }