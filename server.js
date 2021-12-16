// Aller chercher les configurations de l'application
import "dotenv/config";

// Importer les fichiers et librairies
import express, { json, urlencoded } from "express";
import expressHandlebars from "express-handlebars";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cspOption from "./csp-options.js";
import { getProduit } from "./model/produit.js";
// var SSE = require("express-sse");
import SSE from "express-sse";
var sse = new SSE({ commande: "getCommande()" });

import {
  getPanier,
  addToPanier,
  removeFromPanier,
  emptyPanier
} from "./model/panier.js";
import {
  getCommande,
  addCommande,
  modifyEtatCommande,
  getEtatCommande
} from "./model/commande.js";
import { validateId, validatePanier } from "./validation.js";
import { registerUser, GetUsers, SingleUser } from "./model/Auth/register.js";
import {
  isAuthinticate,
  isAdmin,
  isUnAuthinticate
} from "./middleware/authMiddleware.js";

// Création du serveur
const app = express();

// Web WebSocketServer
import WebSocket, { WebSocketServer } from "ws";

import http from "http";
const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });
// Ws Server connection
wss.on("connection", function connection(ws) {
  console.log("A new client is connected");
  ws.on("message", function incoming(data) {
    let datas = Buffer.from(data, "base64").toString("ascii");
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(datas);
      }
    });
  });
});

// });
app.engine(
  "handlebars",
  expressHandlebars({
    helpers: {
      equals: (valeur1, valeur2) => valeur1 === valeur2
    }
  })
);
app.set("view engine", "handlebars");

// Ajout de middlewares
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(express.static("public"));

// Session stored

import cookieParser from "cookie-parser";
import session from "express-session";
app.use(cookieParser());

// const session = require('express-session')
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
  })
);
// Routes

app.get("/stream", sse.init);

// @desc   Read Register page
app.get("/register", isUnAuthinticate, (request, response) => {
  response.render("Auth/register", {
    title: "Signup",
    msz: ""
  });
});

// @desc   Register a user
app.post("/register", async (request, response) => {
  const { username, email, password } = request.body;
  const users = await GetUsers();
  let is_user = users.find(user => user.username === username);
  let is_email = users.find(user => user.email === email);
  if (username == "") {
    response.render("Auth/register", {
      title: "Signup",
      msz: "Please put Your username"
    });
    return false;
  } else if (is_user) {
    response.render("Auth/register", {
      title: "Signup",
      msz: "User Already Exists"
    });
    return false;
  } else if (email == "") {
    response.render("Auth/register", {
      title: "Signup",
      msz: "Please put Your Email"
    });
    return false;
  } else if (is_email) {
    response.render("Auth/register", {
      title: "Signup",
      msz: "This Email is Alreday Exists"
    });
    return false;
  } else if (password == "") {
    response.render("Auth/register", {
      title: "Signup",
      msz: "Please put Your Password"
    });
    return false;
  } else {
    registerUser(username, email, password);
    return response.redirect("/login");
  }
});

// @desc   Read login page
app.get("/login", isUnAuthinticate, (request, response) => {
  response.render("Auth/login", {
    title: "Login",
    msz: ""
  });
});

/**
 * @desc   Login a user
 * @route  POST /Login
 * @access Public
 */
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const user = await SingleUser(username);
  if (username == "" || password == "") {
    response.render("Auth/login", {
      title: "login",
      msz: "Please Fill up the form"
    });
    return false;
  } else if (user == "") {
    response.render("Auth/login", {
      title: "login",
      msz: "Credential doesnot match"
    });
    return false;
  } else if (username == user[0].username && password == user[0].password) {
    request.session.isLoggedIn = true;
    request.session.isLoggeduser = user[0];
    return response.redirect("/");
  } else {
    response.render("Auth/login", {
      title: "login",
      msz: "Credential doesnot match"
    });
    return false;
  }
});

// @desc   LogOut
app.get("/logout", (request, response) => {
  request.session.destroy(err => {
    if (err) {
      return next(err);
    }
    return response.redirect("/login");
  });
});

// Route de la page du menu
app.get("/", async (request, response) => {
  sse.send("content");

  response.render("menu", {
    title: "Menu",
    produit: await getProduit()
  });
});

// Route de la page du panier
app.get("/panier", isAuthinticate, async (request, response) => {
  let panier = await getPanier();
  response.render("panier", {
    title: "Panier",
    produit: panier,
    estVide: panier.length <= 0
  });
});

// Route pour ajouter un élément au panier
app.post("/panier", async (request, response) => {
  // if user looged in they he will be able to upload panier
  let is_log_id = request.session.isLoggedIn;
  if (is_log_id) {
    if (validateId(request.body.idProduit)) {
      addToPanier(request.body.idProduit, 1);
      response.sendStatus(201);
    } else {
      response.sendStatus(400);
    }
  }
});

// Route pour supprimer un élément du panier
app.patch("/panier", async (request, response) => {
  if (validateId(request.body.idProduit)) {
    removeFromPanier(request.body.idProduit);
    response.sendStatus(200);
  } else {
    response.sendStatus(400);
  }
});

// Route pour vider le panier
app.delete("/panier", async (request, response) => {
  if (await validatePanier()) {
    emptyPanier();
    response.sendStatus(200);
  } else {
    response.sendStatus(400);
  }
});

// Route de la page des commandes
app.get(
  "/commandes",
  // isAdmin,
  async (request, response) => {
    response.render("commande", {
      title: "Commandes"
      // commande: await getCommande()
      // etatCommande: await getEtatCommande()
    });
    sse.send({ commande: await getCommande() });
  }
);

// Route pour soumettre le panier
app.post("/commande", async (request, response) => {
  if (await validatePanier()) {
    addCommande();
    response.sendStatus(201);
  } else {
    response.sendStatus(400);
  }
});

// Route pour modifier l'état d'une commande
app.patch("/commande", async (request, response) => {
  if (
    (await validateId(request.body.idCommande)) &&
    (await validateId(request.body.idEtatCommande))
  ) {
    modifyEtatCommande(request.body.idCommande, request.body.idEtatCommande);

    response.sendStatus(200);
  } else {
    response.sendStatus(400);
  }
});

// Renvoyer une erreur 404 pour les routes non définies
app.use(function(request, response) {
  // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
  response.status(404).send(request.originalUrl + " not found.");
});

// Démarrage du serveur
server.listen(process.env.PORT);
console.info(`Serveurs démarré:`);
console.info(`http://localhost:${process.env.PORT}`);
