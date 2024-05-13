import express from "express";
import {logger} from '../middlewares/loggers.js'

import 'dotenv/config'

const router = express.Router();

router.get('/', (req, res) => {

    {
        logger.debug("received logout request ... ")

        res.clearCookie('fc_token', {
            sameSite: 'strict',
            httpOnly: true
        })
        res.clearCookie('fc_backend_version', {
            sameSite: 'strict',
            httpOnly: false
        })
        res.clearCookie('fc_user', {
            sameSite: 'strict',
            httpOnly: true
        })
        
        logger.debug("token removed->> Send code 200 ... ")

        res.status(200).json({ success: true, message: 'token removed --->' });
    }

})

export default router