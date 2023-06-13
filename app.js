const express = require("express");
const app = express();
const ytdl = require('ytdl-core');
const request = require("request");

// Set up a proxy route for the YouTube page
app.get("/youtube", (req, res) => {
	// Send a request to the YouTube website
	const url = "https://www.youtube.com";
	req.pipe(request(url)).pipe(res);
});

// Set up a proxy route for video streaming
app.get("/watch", (req, res) => {
	const videoUrl = "https://www.youtube.com/watch?v=" + req.query.v;
	if (!videoUrl) {
		return res.status(400).send("Please provide a video URL");
	}
res.header('Content-Type', 'video/mp4');

  ytdl(videoUrl, {
    format: 'mp4',
    quality: 'highest'
  }).pipe(res);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
