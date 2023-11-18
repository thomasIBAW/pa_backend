import {findSome} from "../connectors/dbConnector.js";
import {logger} from "./loggers.js";
import jwt from "jsonwebtoken";
const secret = "yourSecretString"  // to be removed!


export async function getFamilyCheck (req, res, next) {

    if (req.params.coll !== 'users'){

        // console.log('reached Middleware...')
            await findSome('family', { "uuid" : `${req.headers.family_uuid}`} )
                .then( (family) => {

                    if (family.length === 0) {
                        logger.warning('No family found. Cannot create item')
                        return res.status(401).json('No family found. Cannot create item')
                    }
                    else {
                        req.familyAdmin = family[0].familyAdmin;
                        next()
                    }
                })
                .catch((err) => {
                    logger.error(err)
                    res.status(404).json(err)
                })
        } else next()


    }
export async function verifyJWTToken (req, res, next) {

    jwt.verify(req.headers.api_key, secret, async function(err, decoded) {
        if (err) {
            logger.error('Error during token verification:', err);
            return res.status(500).json('Error during token verification.');
        }
        if (decoded) {
            console.log('Endpoint Authenticated successful! user: ', decoded.username);
            logger.info(`User <${decoded.username}> successfully Authenticated to endpoint`)

            //if user is not Admin, restrict to only FamilyAdmin users
            if (!decoded.isAdmin) {

                if (!req.familyAdmin.filter(decoded.userUuid)) {
                    logger.error(`User ${decoded.username} is not admin.`);
                    return res.status(401).json(`User ${decoded.username} is not admin.`);
                }
            }

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