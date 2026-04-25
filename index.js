const express = require("express");
const fetch = require("node-fetch");
const FormData = require("form-data");

const app = express();

app.use(express.json({ limit: "10mb" }));

app.post("/edit-image", async (req, res) => {
  try {
    const { image_url, prompt } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: "image_url missing" });
    }

    // 🔹 Télécharger l’image
    const imgRes = await fetch(image_url);
    const buffer = await imgRes.buffer();

    // 🔹 FormData pour OpenAI
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt || "edit this image");
    form.append("image", buffer, {
      filename: "image.png",
      contentType: "image/png",
    });

    // 🔥 Appel OpenAI
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
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
