const jwt = require('jsonwebtoken');
const db = require("../config/db.js");

//Next est un ok tu peux continuer (Apelle le reste de la route)
const auth = async (req, res, next) => {
    try{    
        //Si le jeton est valide
        //Est-ce qu'il y a quelque chose dans la requette?
        if (req.headers.authorization) {
            //Transforme en array et retourne la portion après Bearer
            //Ex d'auth : "Bearer 13wkjsd.hfwuisudhfiusdhf.uisdhf3"
            console.log(req.headers.authorization)
            const jetonAValider = req.headers.authorization.split(" ")[1];
            const jetonDecode = jwt.verify(jetonAValider, process.env.JWT_SECRET);

            const utilisateurVerifie = await db.collection("utilisateurs").doc(jetonDecode.id).get();

            if (utilisateurVerifie.exists) {
                //Si l'utilisateur éxiste, on permet la suite de la requête initiale.
                const utilisateurRecupere = utilisateurVerifie.data();
                req.utilisateur = utilisateurRecupere;

                //Apelle la suite de la requête initial.
                next();  
            } else {
                //Si l'utilisateur n'éxiste pas, on retourne une erreur non autorisée.
                // res.statusCode = 401;
                // res.json({"message": "Non autorisé"});
                throw new Error("Non autorisé")
            }

        } else {
            // res.statusCode = 401;
            // res.json({"message": "Non autorisé"});
            throw new Error("Non autorisé")
        }

    } catch (erreur){
        res.statusCode = 401;
        res.json({message: erreur.message});
    }
}

module.exports = auth;

