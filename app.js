const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js");
const server = express();
const {check, validationResult} = require("express-validator");

//Configuration
dotenv.config();

////Middlewares////
server.use(express.static(path.join(__dirname, "public")));
server.use(express.json());



server.get("/api/films", async (req, res)=>{
    try{
        //Prend les valeurs données pour l'ordre et la limite dans le URL et les mets dans une constante
        const direction = req.query["order-direction"] || "asc";
        const limit = +req.query["limit"] || 50;

        const donneesRef = await db.collection("film").orderBy(direction).limit(limit).get();
        const donneesFinale = [];

        donneesRef.forEach((doc)=>{
            donneesFinale.push(doc.data());
        })

        res.statusCode = 200;
        res.json(donneesFinale);
    } catch (erreur){
        res.statusCode = 500;
        res.json({message: "Une erreur est survenue."})
    }
});


//Prend un film avec son id
server.get("/api/films/:id", async (req, res)=>{

    const id = req.params.id;

    const donneesRef = await db.collection("film").doc(id).get();
    
    if (donneesRef) {
        res.statusCode = 200;
        res.json(donneesRef);
    } else {
        res.statusCode = 404;
        res.json({message: "Film non trouvé"});
    }
    res.send(req.params.id);
});

server.post("/api/films", async (req, res)=>{
    try{
        const nouveauFilm = req.body;

        //TODO:
        //Revient le faire avec express validator si tu a le temps
        //Créer une nouvelle constante et ajoute tout les champs nécéssaires comme ça, si quelequ'un à ajouté quelque chose, il ne sera pas pris en compte
        //Validation des données
        // if(donnees.titre == undefined ||
        //     donnees.genres == undefined ||
        //     donnees.description == undefined ||
        //     donnees.annee == undefined ||
        //     donnees.realisation == undefined ||
        //     donnees.titreVignette == undefined){

        //     res.statusCode = 400;
        //     return res.json({message: "Vous devez fournir les informations nécéssaires"});
        // }

        const ajoutFilm = [];
        ajoutFilm.push(nouveauFilm["titre"])

        return res.json(ajoutFilm);
    
        await db.collection("film").add(nouveauFilm);
    
        res.statusCode = 201;
        res.json({message: "La donnée a été ajoutée"});
    } catch {
        res.statusCode = 500;
        res.json({message: "error"})
    }
});


//Modification
server.put("/api/films/:id", async (req, res)=>{
    const id = req.params.id;
    const donneesModifiees = req.body;

    //TODO:
    //Revient le faire avec express validator si tu a le temps
    //Créer une nouvelle constante et ajoute tout les champs nécéssaires comme ça, si quelequ'un à ajouté quelque chose, il ne sera pas pris en compte
    //Validation des données
    if(donnees.titre == undefined ||
        donnees.genres == undefined ||
        donnees.description == undefined ||
        donnees.annee == undefined ||
        donnees.realisation == undefined ||
        donnees.titreVignette == undefined){

        res.statusCode = 400;
        return res.json({message: "Vous devez fournir les informations nécéssaires"});
    }

    await db.collection("film").doc(id).update(donneesModifiees);
    
    res.status = 200;
    res.json({message: "Les données ont été modifiées"})
});


//Supprimer
server.delete("/api/films/:id", async (req, res)=>{
    //params est tout les : dans ton url. Par exemple, :id, :user etc
    const id = req.params.id;
    const resultat = await db.collection("film").doc(id).delete();

    res.json("Le document a été supprimé");
});

//Récupe info du body
server.post("/api/utilisateurs/inscription", [
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
    check("mdp").escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({
        minLength:8,
        minLowercase:1,
        minNumbers:1,
        minUppercase:1,
        minSymbols:1
    })
], async (req, res) => {

    const validation = validationResult(req);

    if (validation.errors.length > 0) {
        res.statusCode = 400;
        return res.json({message: "Données non comforme"})
    }

    //Récupe info du body
    const {courriel, mdp} = req.body;

    //Vérifie si courriel existe
    const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
    const utilisateurs = [];

    docRef.forEach((doc)=>{
        utilisateurs.push(doc.data());
    })

    //Si oui, erreur
    if (utilisateurs.length > 0) {
        res.statusCode = 400;
        return res.json({message: "Le courriel est déjà utilisé"});
    }

    //Valide la donnée/nettoie la donnée

    //TODO:
    //Encrypte le mot de passe

    //Enregistre/nettoie la donnée
    const nouvelUtilisateur = {courriel, mdp};
    await db.collection("utilisateurs").add(nouvelUtilisateur);
    delete nouvelUtilisateur.mdp;
    
    //Renvoie true
    res.statusCode = 200;
    res.json(nouvelUtilisateur);


});

server.post("/api/utilisateurs/connexion", async (req, res) => {

    //Récupe info du body
    const {courriel, mdp} = req.body;

    //Vérifie si courriel existe
    const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
    const utilisateurs = [];
    docRef.forEach((utilisateur)=>{
        utilisateurs.push(utilisateur.data());
    })

    //Si non erreur
    if (utilisateurs.length == 0) {
        res.statusCode = 400;
        return res.json({message: "Le courriel n'existe pas"});
    }

    //TODO:
    //Encrypte le mot de passe

    //compare
    if (utilisateurs[0].mdp !== mdp){
        res.statusCode = 400;
        return res.json({message: "Mot de passe incorrecte"});
    }

    //Retourne les infos de l'utilisateur sans le mot de passe
    delete utilisateurs[0].mdp;
    res.statusCode = 200;
    res.json(utilisateurs);
});


//DOIT ÊTRE LA DERNIÈRE
server.use((req, res)=>{
    res.statusCode = 404;
    //Render est utilisé pour les engins de gabarit
    res.render("404", {url: req.url});
})


server.listen(process.env.PORT, ()=>{
    console.log("Le serveur est démarré");
});