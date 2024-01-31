const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");

//Configuration
dotenv.config();

const server = express();
////////////////////////////

//Mustache est un engin de gabarit comme twig
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());


//Middlewares
//Doit être avant les points d'accès

//Done tout les fichiers du dossier public. Dans le font, ça fait une shit ton de demandes get au serveur pour chaque fichier.
server.use(express.static(path.join(__dirname, "public")));


//Points d'accès    (Arrête la requête)
server.get("/donnees",(req, res)=>{
    //Ceci sera remplacé par un fetch ou un appel à la base de données
    const donnees = require("./data/donneesTest.js");
    res.statusCode = 200;
    res.json(donnees);
});


/**
 * @method get
 * @param id
 * Permet d'accéder à un utilisateur
 */
server.get("/donnees/:id", (req, res)=>{
    console.log(req.params.id);
    const donnees = require("./data/donneesTest.js");

    const utilisateur = donnees.find((element)=>{
        //Va check si il y en a et retourne le premier trouvé
        return element.id == req.params.id;
    });

    if (utilisateur) {
        res.statusCode = 200;
        res.json(utilisateur);
    } else {
        res.statusCode = 404;
        res.json({message: "Utilisateur non trouvé"});
    }
    res.send(req.params.id);
});


//DOIT être en dernier
//Gestion page 404 - requête non trouvée

server.use((req, res)=>{
    res.statusCode = 404;
    //Render est utilisé pour les engins de gabarit
    res.render("404", {url: req.url});
})



server.listen(process.env.PORT, ()=>{
    console.log("Le serveur est démarré");
});