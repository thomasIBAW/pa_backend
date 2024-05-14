import {findSome} from "../connectors/dbConnector.js";
import {logger} from "./loggers.js";
import 'dotenv/config'
import jwt from "jsonwebtoken";
const secret = process.env.mySecret


let currentFamily = {}
let currentApiKey = ""

// Identifies the user by the provided JWT. If the user is Server admin (isAdmin) then this info is provided to the next middleware
export async function identUser(req, res, next) {
    logger.debug("reached the identUser Middleware ... ")

    // checks if api_key comes from Header or Cookie
    if (!req.headers.api_key) {
            if (!req.cookies.fc_token) {
                logger.error(`${req.params.coll} - identUser - No ApiKey found.  Check for "api_key" in the Request header`)
                return res.status(401).json({ message:`${req.params.coll} - No ApiKey found.  Check for "api_key" in the Request header`})
            }
            else {
                // if cookie exists:
                logger.debug("Received Token from Cookie")
                currentApiKey = req.cookies.fc_token
            }
        } else {
            logger.debug("Received Token from request Header")
            currentApiKey = req.headers.api_key
    }

    // adding the token to the rest of the middlewares    
    req.token = currentApiKey;

    // Sets is Admin to false until proven user is an server Admin
    req.isAdmin = false;
    
    // Verify the jwt to add user info into the request workflow
    jwt.verify(currentApiKey, secret, async function(err, decoded) {
            if (err) {
                logger.error(`${req.params.coll} - middlewares.js / identUser /, Error during token verification - ${err}`);
                // console.log(req.params.coll, ' - middlewares.js / verifyJWTToken /,Error during token verification:', err);
                return res.status(500).json({message: 'Error during token verification.'});
            }
            if (decoded) {
                //console.log('Endpoint Authenticated successful! user: ', decoded.username);
                logger.info(`${req.params.coll} - User <${decoded.username}> successfully Authenticated to endpoint`)
    
                //if user is not Admin, restrict to only FamilyAdmin users
                if (decoded.isAdmin) {
                    req.isAdmin = true
                    logger.debug(`the requesting user : ${decoded.username} is identified as server admin.`)
                } ;
    
                // pass the decoded JWT to the next middlewares
                req.decoded = decoded

                logger.debug(`Middleware identUser successful -  ${JSON.stringify(decoded)}`)
                next()
                
            }
            else {
                logger.error(`User <${decoded.username}> - Authentication failed - Wrong token!`)
                res.status(401).json(`User <${decoded.username}> - Authentication failed - Wrong token!`);
            }
        })

    
}


// export async function getCookieData(req, res, next) {
//     logger.debug("reached the getCookieData Middleware ... ")

//     // checks if api_key comes from Header or Cookie
//     if (!req.headers.api_key) {
//         if (!req.cookies.fc_token) {
//             logger.error(`${req.params.coll} - getCookieData - No ApiKey found.  Check for "api_key" in the Request header`)
//             return res.status(401).json({ message:`${req.params.coll} - No ApiKey found.  Check for "api_key" in the Request header`})
//         }
//         else {
//             // if cookie exists:
//             logger.debug("Received Token from Cookie")

//             currentApiKey = req.cookies.fc_token
//         }
//     } else {
//         logger.debug("Received Token from request Header")
//         currentApiKey = req.headers.api_key
//     }
//     req.token = currentApiKey
//     next()
// }


export async function getFamilyCheck(req, res, next) {

    // checks if family uuid comes from Header or Cookie
    if (!req.headers.family_uuid) {
        if (!req.cookies.fc_user) {
            // logger.debug(`${req.params.coll} - getFamilyCheck - no family_uuid received from the query ! Aborted...`)
            logger.error(`${req.params.coll} - getFamilyCheck - no family_uuid received from the query ! Aborted...`)
            return res.status(401).json({ message:`${req.params.coll} - No family found.  Check for "family_uuid" in the Request header`})
            //throw new Error("- getFamilyCheck - no family_uuid received from the query ! Aborted...")
        }
        else {
            // if cookie exists:
            currentFamily = JSON.parse(req.cookies.fc_user)
            logger.debug(`Requesting user from Cookie: ${JSON.parse(req.cookies.fc_user)}`)
        }
    } else {
        currentFamily.linkedFamily = req.headers.family_uuid
        logger.debug(`Requesting family from Header: ${req.headers.family_uuid}`)
    }

    

    /*   this middleware checks if a family with the provided uuid, exist and returns the familyAdmins and members to next()
    the check is done only for non-user creation calls, because at the user creation time, family is not yet created */

    logger.debug(`${req.params.coll} - Request has reached the "getFamilyCheck" middleware, Requested Family: ${currentFamily.linkedFamily}`)


    if (req.params.coll !== 'users'){
         await findSome('family', { "uuid" : `${currentFamily.linkedFamily}`} )
            .then( (family) => {

                if (family.length === 0) {
                    logger.error(`${req.params.coll} - getFamilyCheck - No family found. Check for "family_uuid" in the Request header`)
                    res.status(401).json(`${req.params.coll} - getFamilyCheck - No family found.  Check for "family_uuid" in the Request header`)
                }
                else {
                    req.family = family[0]
                    req.familyAdmin = family[0].familyAdmin;
                    req.familyMember = family[0].familyMember;
                    logger.debug('getFamilyCheck successful')
                    next()
                }
            })
            .catch((err) => {
                logger.error(`${req.params.coll} - error in middleware getFamilyCheck - ${rew.headers.family_uuid} - ${err}`)
                res.status(404).json(err)
            })
    } else next()
}

export async function checkUserInFamily(req, res, next) {

    /*   this middleware checks if the currently logged in user (requester) has admin rights or is member in a family*/

    logger.debug(`${req.params.coll} - Request has reached "checkUserInFamily" middleware`)

    let isUserFamilyMember = false
    let isUserFamilyAdmin = false

    if (req.params.coll !== "users") {
        isUserFamilyAdmin = req.familyAdmin.includes(req.decoded.userUuid)
        isUserFamilyMember = req.familyMember.includes(req.decoded.userUuid)
        req.isUserFamilyAdmin = isUserFamilyAdmin
        req.isUserFamilyMember = isUserFamilyMember
        logger.debug('checkUserInFamily successful')
        next()
    }
    else next()
}

export async function checkDuplicates (req, res, next) {

    logger.debug(req.params.coll, ' - Request has reached checkDuplicates middleware')

    if (req.params.coll === 'users'){
        // console.log('reached Middleware...', req.params.coll, req.body.username)
            await findSome('users', { "username" : `${req.body.username}`} )
                .then( (user) => {
                    if (user.length === 0) {
                        logger.debug('checkDuplicates successful')
                        next()
                    }
                    else {
                        // console.log(user)
                        logger.warn('Duplicated username. Cannot create item', user)
                        return res.status(403).json('Duplicated username. Cannot create item')
                    }
                })
                .catch((err) => {
                    logger.error('error in middleware checkDuplicates', err)

                    res.status(404).json(err)
                })
        }
    else if (req.params.coll === 'family'){

        logger.debug('reached Middleware...')

        await findSome('family', { "familyName" : `${req.body.familyName}`} )
            .then( (fam) => {
                if (fam.length === 0) {
                    next()
                }
                else {
                    logger.error('Duplicated family name. Cannot create item')
                    return res.status(403).json({ message: 'Duplicated family name. Cannot create item'})
                }
            })
            .catch((err) => {
                logger.error(`middlewares.js / Family / ${err}`)
                // console.log('error in middleware getFamilyCheck findSome call')
                res.status(404).json(err)
            })
        }
    else next()
}
export async function verifyJWTToken (req, res, next) {

    if (!req.token) {
        // checks if api_key comes from Header or Cookie
        if (!req.headers.api_key) {
            if (!req.cookies.fc_token) {
                // console.log(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
                logger.error(`${req.params.coll} - getFamilyCheck - No ApiKey found.  Check for "api_key" in the Request header`)
                return res.status(401).json({ message:`${req.params.coll} - No ApiKey found.  Check for "api_key" in the Request header`})
            }
            else {
                // if cookie exists:

                req.token = req.cookies.fc_token
            }
        } else {
            req.token = req.headers.api_key
        }
    }

    logger.debug(`${req.params.coll} - Request has reached the "verifyJWTToken" middleware`)

    jwt.verify(req.token, secret, async function(err, decoded) {
        if (err) {
            logger.error(`${req.params.coll} - middlewares.js / verifyJWTToken /, Error during token verification - ${err}`);
            // console.log(req.params.coll, ' - middlewares.js / verifyJWTToken /,Error during token verification:', err);
            return res.status(500).json('Error during token verification.');
        }
        if (decoded) {
            //console.log('Endpoint Authenticated successful! user: ', decoded.username);
            logger.info(`${req.params.coll} - User <${decoded.username}> successfully Authenticated to endpoint`)

            //if user is not Admin, restrict to only FamilyAdmin users
            // if (!decoded.isAdmin) {
            //
            //     if (!req.familyAdmin.filter(decoded.userUuid)) {
            //         logger.error(`User ${decoded.username} is not admin.`);
            //         return res.status(401).json(`User ${decoded.username} is not admin.`);
            //     }
            // }

            logger.debug(`My user uuid: ${decoded.userUuid}. All Admins in current Family are: ${req.familyAdmin}`)

            req.decoded = decoded
            logger.debug('verifyJWTToken successful')
            next()
            // Code to be executed here:
        }
        else {
            logger.error(`User <${decoded.username}> - Authentication failed - Wrong token!`)
            res.status(401).json(`User <${decoded.username}> - Authentication failed - Wrong token!`);
        }
    })
    }