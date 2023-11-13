
export function verifyToken( req, res, next){

const bearerHeader = req.headers['authorization']

if (typeof bearerHeader !== 'undefined'){

    const bearer = bearerHeader.split(' ')
    const authToken = bearer[1];
    req.token = authToken;

    next();

} else {
    res.status(403).json({message: 'Forbidden'})
}

}


