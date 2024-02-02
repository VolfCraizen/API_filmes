const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js");
const { ServerResponse } = require("http");

//Configuration
dotenv.config();

////Middlewares////
server.use(express.static(path.join(__dirname, "public")));
server.use(express.json());



server.get("/api/films", async (req, res)=>{
    try{
        const donneesRef = await db.collection("film").orderBy("titre").limit(limit).get();

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
        const donnees = req.body;

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
    
        await db.collection("film").add(donnees);
    
        res.statusCode = 201;
        res.json({message: "La donnée a été ajoutée", donnees: donnees});
    } catch {
        res.statusCode = 500;
        res.json({message: "error"})
    }
});


//Modification
server.put("/api/films/:id", async (req, res)=>{
    const id = req.params.id;
    const donneesModifiees = req.body;

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



server.use((req, res)=>{
    res.statusCode = 404;
    //Render est utilisé pour les engins de gabarit
    res.render("404", {url: req.url});
})


server.listen(process.env.PORT, ()=>{
    console.log("Le serveur est démarré");
});