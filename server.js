const express = require("express");
const { spawn } = require("child_process");

const app = express(); // Initialize Express
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON

app.get("/api/info", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

    const ytProcess = spawn("yt-dlp", ["-j", url]);

    let output = "";
    ytProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    ytProcess.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
    });

    ytProcess.on("close", (code) => {
        if (code !== 0) return res.status(500).json({ error: "yt-dlp execution failed" });

        try {
            const videoInfo = JSON.parse(output);
            res.json({
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                duration: videoInfo.duration_string,
                formats: videoInfo.formats.map((f) => ({
                    quality: f.format_note,
                    format: f.ext,
                    url: f.url
                }))
            });
        } catch (err) {
            res.status(500).json({ error: "Failed to parse video data" });
        }
    });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
