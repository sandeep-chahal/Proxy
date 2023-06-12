const express = require("express");
const app = express();
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

	// Stream the video from the URL
	const stream = request(videoUrl);
	stream.on("error", (err) => {
		console.error(`Error streaming video: ${err.message}`);
		res.status(500).send(`Error streaming video: ${err.message}`);
	});
	stream.on("end", () => {
		console.log("Video streaming ended");
		res.end();
	});
	stream.pipe(res);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
