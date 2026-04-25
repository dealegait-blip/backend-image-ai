const express = require("express");
const fetch = require("node-fetch");
const FormData = require("form-data");

const app = express();

app.use(express.json({ limit: "10mb" }));

// ✅ TA ROUTE PRINCIPALE
app.post("/edit-image", async (req, res) => {
  try {
    const { image_url, prompt } = req.body;

    const imgRes = await fetch(image_url);
    const buffer = await imgRes.buffer();

    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt || "edit this image");
    form.append("image", buffer, {
      filename: "image.png",
      contentType: "image/png",
    });

    const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await openaiRes.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});


// 🔥 AJOUTE ÇA ICI 👇
app.get("/", (req, res) => {
  res.send("OK");
});


// ✅ ENSUITE LE LISTEN
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
