const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

const templatesPath = path.join(__dirname, "templates");

app.post("/api/scontrino", upload.single("immagine"), (req, res) => {
  const { brand, email, ...campi } = req.body;
  const templatePath = path.join(templatesPath, `${brand}.html`);

  if (!fs.existsSync(templatePath)) {
    return res.status(404).send("Template non trovato");
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Sostituisce tutti i segnaposto presenti nel template
  html = html.replace(/\{(\w+?)\}/g, (_, campo) => {
    return campi[campo] || `[${campo} mancante]`;
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.sendMail(
    {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Scontrino ${brand}`,
      html: html,
    },
    (err, info) => {
      if (err) return res.status(500).send("Errore invio email");
      res.send("Email inviata con successo");
    }
  );
});

// Ritorna i campi dinamici del template richiesto
app.get("/api/campi/:brand", (req, res) => {
  const brand = req.params.brand;
  const templateFile = path.join(templatesPath, brand + ".html");

  if (!fs.existsSync(templateFile)) {
    return res.status(404).send("Template non trovato");
  }

  const html = fs.readFileSync(templateFile, "utf-8");
  const matches = [...html.matchAll(/\{(\w+?)\}/g)].map((m) => m[1]);
  const uniqueFields = [...new Set(matches)];
  res.json(uniqueFields);
});

app.listen(3001, () => {
  console.log("✅ Backend in ascolto su http://localhost:3001");
});
