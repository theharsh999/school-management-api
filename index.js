const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(express.json());

// DB connection
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// connect
db.connect((err) => {
    if (err) {
        console.error("DB Error:", err);
        return;
    } else {
        console.log("Connected to MySQL");
    }
});

function getDistance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(
        Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)
    );
}

// Route for adding School data 
app.post("/addSchool", (req, res) => {
    console.log("AddSchool API hit");
    const { name, address, latitude, longitude } = req.body;

    // adding validation
    if (
        !name || !address ||
        latitude == null || longitude == null ||
        name.trim() === "" || address.trim() === ""
    ) {
        return res.status(400).json({ error: "All fields are required and must be valid" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 ||
        lon < -180 || lon > 180
    ) {
        return res.status(400).json({ error: "Invalid coordinates" });
    }

    // defining query for SQL database
    const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;

    db.query(query, [name, address, lat, lon], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            success: true,
            message: "School added successfully",
            id: result.insertId
        });
    });
});

// Route for show all the Schools
app.get("/listSchools", (req, res) => {
    const { latitude, longitude } = req.query;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (latitude == null || longitude == null || isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
    }

    db.query("SELECT * FROM schools", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }

        const sorted = results.map(school => ({
            ...school,
            distance: getDistance(lat, lon, school.latitude, school.longitude)
        }))
            .sort((a, b) => a.distance - b.distance);

        res.json(sorted);
    });
});

app.get("/", (req, res) => {
    res.send("API Working");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
