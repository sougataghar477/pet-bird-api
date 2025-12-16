const express = require("express");
const sql = require("./db");
const supabase = require("./storage");
const multer = require("multer");
const popularBirds = require("./popularBirds.json");
const PORT = process.env.PORT || 3000;
const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use(express.static("public"));
app.use(express.json());

/**
 * SHOW RANDOM IMAGE
 */
app.post("/showNewImage", async (req, res) => {
  const { breed } = req.body;
  console.log("Requested breed:", breed);

  try {
    // Specific breed
    if (breed !== "random" && breed !== "other") {
      const images = await sql`
        SELECT *
        FROM saved_images
        WHERE breed_name = ${breed}
        OFFSET FLOOR(
          RANDOM() * GREATEST(
            (SELECT COUNT(*) FROM saved_images WHERE breed_name = ${breed}),
            1
          )
        )
        LIMIT 1
      `;

      if (images.length === 0) {
        return res.json({ image: "No Image Found" });
      }

      return res.json({ image: images[0].image_url });
    }

    //  Random from all breeds
    else if (breed === "random") {
      const images = await sql`
        SELECT *
        FROM saved_images
        OFFSET FLOOR(
          RANDOM() * GREATEST(
            (SELECT COUNT(*) FROM saved_images),
            1
          )
        )
        LIMIT 1
      `;

      if (images.length === 0) {
        return res.json({ image: "No Image Found" });
      }

      return res.json({ image: images[0].image_url });
    }

    // Other (non-popular birds)
    else if (breed === "other") {
      console.log("other detected")  
      const countResult = await sql`
      SELECT COUNT(*) AS count
      FROM saved_images
      WHERE breed_name != ALL(${popularBirds})
      `;
      
      const count = Number(countResult[0].count);

      if (count === 0) {
        return res.json({ image: "No Image Found" });
      }
      //Filter out all values that are not in the array
      const images = await sql`
        SELECT *
        FROM saved_images
        WHERE breed_name != ALL(${popularBirds}) 
        OFFSET FLOOR(RANDOM() * ${count})
        LIMIT 1
      `;

      return res.json({ image: images[0].image_url });
    }

    // fallback
    return res.json({ image: "Invalid breed option" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * UPLOAD IMAGE
 */
app.post("/uploadNewImage", upload.single("bird-file"), async (req, res) => {
  try {
    let breed =
      req.body["breed-value"] === "other"
        ? req.body["other-bird-name"]
        : req.body["breed-value"];

    const normalisedBreedName = breed.toLowerCase().trim();

    const fileName = req.file.originalname
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const filePath = `${normalisedBreedName}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("pet-birds")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Storage error:", error);
      return res.status(500).json({ message: error });
    }

    const publicUrl = `${process.env.SUPABASE_PROJECT_URL}/storage/v1/object/public/pet-birds/${data.path}`;

    const result = await sql`
      INSERT INTO saved_images (breed_name, image_url, created_at)
      VALUES (${normalisedBreedName}, ${publicUrl}, NOW())
    `;

    res.json({
      image: publicUrl,
      message: "Uploaded & saved successfully",
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log("Server running on "+PORT);
});
