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

app.post("/api/scontrino", upload.single("immagine"), (req, res) => {
  const { brand, prodotto, prezzo, descrizione, email } = req.body;
  const templatePath = path.join(__dirname, "templates", `${brand}.html`);
  if (!fs.existsSync(templatePath)) {
    return res.status(404).send("Template non trovato");
  }

  let html = fs.readFileSync(templatePath, "utf-8");
  html = html.replace("{{prodotto}}", prodotto)
             .replace("{{prezzo}}", prezzo)
             .replace("{{descrizione}}", descrizione);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Scontrino ${brand}`,
    html: html,
  }, (err, info) => {
    if (err) return res.status(500).send("Errore invio email");
    res.send("Email inviata");
  });
});

app.listen(3001, () => console.log("Backend in ascolto su http://localhost:3001"));