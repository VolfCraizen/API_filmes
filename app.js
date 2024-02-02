const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js");
const { ServerResponse } = require("http");

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

//Permet d'accepter des body en Json dans les requêtes
server.use(express.json());

//Points d'accès    (Arrête la requête)
server.get("/donnees", async (req, res)=>{
    try{
        //Ceci sera remplacé par un fetch ou un appel à la base de données
        //const donnees = require("./data/donneesTest.js");

        //Va afficher ce qui apparait après le ? dans le url
        console.log(req.query)
        //Si req.query est undefined, prend l'alternatif
        const direction = req.query["order-direction"] || "asc";
        const limit = +req.query["limit"] || 50;     //+ converti en nombre

        const donneesRef = await db.collection("test").orderBy("user", direction).limit(limit).get();

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


// //Film (tp1)
// server.get("/api/films", async (req, res)=>{

//     const donneesRef = await db.collection("film").orderBy("titre").get();

//     const donneesFinale = [];

//     donneesRef.forEach((doc)=>{
//         donneesFinale.push(doc.data());
//     })

//     res.statusCode = 200;
//     res.json(donneesFinale);
// });

// //Aura sûrement besoin d'un where
// server.get("/api/films/:id", async (req, res)=>{

//     const donneesRef = await db.collection("film").orderBy("titre").get();

//     if (utilisateur) {
//         res.statusCode = 200;
//         res.json(utilisateur);
//     } else {
//         res.statusCode = 404;
//         res.json({message: "Utilisateur non trouvé"});
//     }
//     res.send(req.params.id);
// });

server.post("/donnees", async (req, res)=>{
    try{
        const test = req.body;

        //Validation des données
        if(test.user==undefined){
            res.statusCode = 400;
            return res.json({message: "Vous devez fournir un utilisateur"});
        }
    
        await db.collection("test").add(test);
    
        res.statusCode = 201;
        res.json({message: "La donnée a été ajoutée", donnees: test});
    } catch {
        res.statusCode = 500;
        res.json({message: "error"})
    }
});

//Ajoute tout dans le fichier donneesTest dans la db
server.post("/donnees/initialiser", async (req, res)=>{
    const donneesTest = require("./data/donneesTest.js");
    donneesTest.forEach(async (element)=>{
        await db.collection("test").add(element);
    })

    res.statusCode = 200;
    res.json({
        message: "Données initialisées"
    })
    
})

server.put("/donnees/:id", async (req, res)=>{
    const id = req.params.id;
    const donneesModifiees = req.body;
    //Validation ici

    await db.collection("test").doc(id).update(donneesModifiees);
    
    res.status = 200;
    res.json({message: "La donnees a été modifiée"})
})

server.delete("/donnees/:id", async (req, res)=>{
    //params est tout les : dans ton url. Par exemple, :id, :user etc
    const id = req.params.id;
    const resultat = await db.collection("test").doc(id).delete();

    res.json("Le document a été supprimé");
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