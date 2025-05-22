const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer"); // Import Nodemailer
const multer = require("multer");
const path = require("path");
const cron = require("node-cron"); // Import node-cron
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Pripojenie k MongoDB
mongoose
  .connect("mongodb://localhost:27017/transportsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Definícia schémy a modelu
const transportSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  id: { type: String, required: true },
  carrier: { type: String, required: true },
  loading: { type: String, required: true },
  unloading: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  cmrFile: { type: String }, // Pridané pole pre CMR súbor
  unloadedAt: { type: Date },
  movedToHistoryAt: { type: Date, default: null },
});

const Transport = mongoose.model("Transport", transportSchema);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Používame Gmail (môžeš zmeniť podľa potreby)
  auth: {
    user: "adktransports@gmail.com", // Tvoj e-mail
    pass: "wnnqsqxjjnnnagyi", // Tvoje heslo alebo App Password
  },
});

// Nastavenie úložiska pre nahrané súbory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // priečinok uploads v backend
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Endpoint na upload CMR súboru
app.post("/api/upload-cmr/:id", upload.single("cmr"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "Súbor nebol nahraný" });
  }
  try {
    // Ulož cestu k súboru do prepravy
    const updated = await Transport.findByIdAndUpdate(
      id,
      { cmrFile: req.file.filename },
      { new: true }
    );
    res.json({ message: "CMR nahrané", file: req.file.filename, updated });
  } catch (err) {
    res.status(500).json({ error: "Chyba pri ukladaní CMR" });
  }
});

// Sprístupni uploads priečinok ako statický
app.use("/uploads", express.static("uploads"));

// Endpoint na odoslanie e-mailu
app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, attachment } = req.body;

  const mailOptions = {
    from: "radoslav.clovecko@gmail.com",
    to,
    subject,
    text,
    attachments: attachment
      ? [
          {
            filename: attachment.filename,
            path: path.join(__dirname, attachment.path), // Absolútna cesta
          },
        ]
      : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "E-mail bol úspešne odoslaný!" });
  } catch (error) {
    console.error("Chyba pri odosielaní e-mailu:", error);
    res.status(500).json({ error: "Chyba pri odosielaní e-mailu" });
  }
});

// GET endpoint na získanie všetkých prepráv
app.get("/api/transports", async (req, res) => {
  try {
    let filter = {};
    if (req.query.history === "true") {
      filter.movedToHistoryAt = { $ne: null };
    } else if (req.query.history === "false") {
      filter.movedToHistoryAt = null;
    }
    const transports = await Transport.find(filter);
    res.json(transports);
  } catch (err) {
    res.status(500).json({ error: "Chyba pri získavaní prepráv" });
  }
});

// POST endpoint na pridanie novej prepravy
app.post("/api/transports", async (req, res) => {
  const newTransport = new Transport(req.body);

  try {
    const savedTransport = await newTransport.save();
    res
      .status(201)
      .json({ message: "Preprava bola úspešne pridaná!", savedTransport });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Chyba pri pridávaní prepravy", details: err.message });
  }
});

// PUT endpoint na aktualizáciu prepravy
app.put("/api/transports/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  // Ak sa status mení na "Vyložené", nastav unloadedAt na aktuálny čas
  if (updatedData.status === "Vyložené") {
    updatedData.unloadedAt = new Date();
  }

  try {
    const updatedTransport = await Transport.findOneAndUpdate(
      { _id: id },
      updatedData,
      { new: true }
    );

    if (!updatedTransport) {
      return res.status(404).json({ error: "Preprava nebola nájdená" });
    }

    res.status(200).json({
      message: "Preprava bola úspešne aktualizovaná",
      updatedTransport,
    });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Chyba pri aktualizácii prepravy", details: err.message });
  }
});

// Každých 10 minút skontroluje a presunie prepravy, ktoré sú "Vyložené" viac ako 6 hodín do histórie
cron.schedule("*/10 * * * *", async () => {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  try {
    const result = await Transport.updateMany(
      {
        status: "Vyložené",
        unloadedAt: { $lte: sixHoursAgo },
        movedToHistoryAt: null,
      },
      { movedToHistoryAt: new Date() }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `Presunutých do histórie po 6 hodinách: ${result.modifiedCount}`
      );
    }
  } catch (err) {
    console.error("Chyba pri automatickom presune do histórie:", err);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
