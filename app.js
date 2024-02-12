const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const bcrypt = require("bcrypt");
const db = require("./config/db.js");
const server = express();
const {check, validationResult} = require("express-validator");
const { log } = require("console");

//Configuration
dotenv.config();

////Middlewares////
server.use(express.static(path.join(__dirname, "public")));
server.use(express.json());

server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());


//Récupère la liste de film
server.get("/api/films", async (req, res)=>{
    try{

        //Prend les valeurs données pour l'ordre, la limite et le sujet dans le URL et les mets dans une constante si il n'y a rien, utilise des valeurs par défaut
        const direction = req.query["order-direction"] || "asc";
        const limit = +req.query["limit"] || 50;
        const subject = req.query["subject"] || "titre";

        //S'assure que le sujet est sois par titre, par annee par réalisation
        if (subject === "titre" || subject === "annee" || subject === "realisation") {
            const donneesRef = await db.collection("film").orderBy(subject, direction).limit(limit).get();
            const donneesFinale = [];

            donneesRef.forEach((doc)=>{
                donneesFinale.push(doc.data());
            })

            res.statusCode = 200;
            res.json(donneesFinale);
        } else {
            res.statusCode = 400;
            return res.json({message: "Impossible de trier par ce sujet"})
        }

    
    } catch (erreur){
        res.statusCode = 500;
        res.json({message: "Une erreur est survenue."})
    }
});


//Prend un film avec son id
server.get("/api/films/:id", async (req, res)=>{

    const id = req.params.id;

    const donneesRef = await db.collection("film").doc(id).get();
    const donnee = donneesRef.data();
    
    if (donnee) {
        res.statusCode = 200;
        return res.json(donnee);
    } else {
        res.statusCode = 404;
        return res.json({message: "Film non trouvé"});
    }
});

server.post("/api/films",  [
    check("titre").escape().trim().notEmpty(),
    check("genres").escape().trim().notEmpty(),
    check("description").escape().trim().notEmpty(),
    check("annee").escape().trim().notEmpty().isInt().isLength(4),
    check("realisation").escape().trim().notEmpty(),
    check("titreVignette").escape().trim().notEmpty(),

], async (req, res)=>{

    const validation = validationResult(req);

    if (validation.errors.length > 0) {
        res.statusCode = 400;
        return res.json({message: "Données non comforme"})
    }

    try{
        const film = {};
        film.titre = req.body.titre;
        film.genres = req.body.genres;
        film.description = req.body.description;
        film.annee = req.body.annee;
        film.realisation = req.body.realisation;
        film.titreVignette = req.body.titreVignette;
    
        await db.collection("film").add(film);
    
        res.statusCode = 201;
        res.json({message: "La donnée a été ajoutée"});
    } catch {
        res.statusCode = 500;
        res.json({message: "error"})
    }
});


//Modification
server.put("/api/films/:id", [
    check("titre").escape().trim().notEmpty(),
    check("genres").escape().trim().notEmpty(),
    check("description").escape().trim().notEmpty(),
    check("annee").escape().trim().notEmpty().isInt().isLength(4),
    check("realisation").escape().trim().notEmpty(),
    check("titreVignette").escape().trim().notEmpty(),

], async (req, res)=>{

    const validation = validationResult(req);

    if (validation.errors.length > 0) {
        res.statusCode = 400;
        return res.json({message: "Données non comforme"})
    }

    const id = req.params.id;
    const donneesModifiees = {};
    donneesModifiees.titre = req.body.titre;
    donneesModifiees.genres = req.body.genres;
    donneesModifiees.description = req.body.description;
    donneesModifiees.annee = req.body.annee;
    donneesModifiees.realisation = req.body.realisation;
    donneesModifiees.titreVignette = req.body.titreVignette;

    const donneesRef = await db.collection("film").doc(id).get();
    const donnee = donneesRef.data();

    if (donnee) {
        await db.collection("film").doc(id).update(donneesModifiees);
        res.statusCode = 200;
        res.json({message: "Les données ont été modifiées"})
    } else {
        res.statusCode = 404;
        return res.json({message: "Film non trouvé"});
    }
    
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

    //Encrypte le mot de passe
    const hash = await bcrypt.hash(mdp, 10);

    //Enregistre/nettoie la donnée
    const nouvelUtilisateur = {courriel, mdp: hash};
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

    const utilisateurAValider = utilisateurs[0];
    const estValide = await bcrypt.compare(mdp, utilisateurAValider.mdp)

    //compare
    if (estValide === false){
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
