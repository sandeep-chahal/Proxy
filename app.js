const express = require("express");
const app = express();
const ytdl = require("ytdl-core");
const request = require("request");
const puppeteer = require("puppeteer");
const { Readable } = require("stream");

// Set up a proxy route for the YouTube page
app.get("/youtube", (req, res) => {
	// Send a request to the YouTube website
	const url = "https://www.youtube.com";
	req.pipe(request(url)).pipe(res);
});
app.get("/yt_search", (req, res) => {
	// Send a request to the YouTube website
	const url = "https://www.youtube.com/results?search_query=" + req.query.q;
	req.pipe(request(url)).pipe(res);
});
app.get("/", (req, res) => {
	// Send a request to the YouTube website
	// const url = "https://www.youtube.com";
	// req.pipe(request(url)).pipe(res);
	// res.sendFile(__dirname, "/index.html");
	res.sendFile(__dirname + "/index.html");
});

// Set up a proxy route for video streaming
// app.get("/watch", (req, res) => {
// 	const videoUrl = "https://www.youtube.com/watch?v=" + req.query.v;
// 	if (!videoUrl) {
// 		return res.status(400).send("Please provide a video URL");
// 	}
// 	res.header("Content-Type", "video/mp4");

// 	ytdl(videoUrl, {
// 		format: "mp4",
// 		quality: "highest",
// 	}).pipe(res);
// });
app.get("/watch", async (req, res) => {
	const videoUrl = "https://www.youtube.com/watch?v=" + req.query.v;

	if (!videoUrl) {
		return res.status(400).send("Please provide a video URL");
	}

	try {
		const info = await ytdl.getInfo(videoUrl);
		const format = ytdl.chooseFormat(info.formats, { quality: "highest" });

		if (!format) {
			return res.status(400).send("Could not find suitable video format");
		}

		res.header("Content-Type", "video/mp4");
		res.header("Content-Length", format.contentLength);
		res.header("Accept-Ranges", "bytes");

		// Set up range headers
		const { range } = req.headers;
		if (range) {
			const parts = range.replace(/bytes=/, "").split("-");
			const start = parseInt(parts[0], 10);
			const end = parts[1] ? parseInt(parts[1], 10) : format.contentLength - 1;
			const chunkSize = end - start + 1;
			res
				.status(206)
				.header("Content-Range", `bytes ${start}-${end}/${format.contentLength}`)
				.header("Content-Length", chunkSize);
			ytdl(videoUrl, { format, range }).pipe(res);
		} else {
			ytdl(videoUrl, { format }).pipe(res);
		}
	} catch (err) {
		console.error(err);
		res.status(500).send("An error occurred while streaming the video");
	}
});

app.use("/youtube", async (req, res) => {
	let url = req.path;
	console.log(url);
	if (!url.startsWith("http")) url = "https://www.youtube.com/" + url;
	// Launch Puppeteer browser
	const browser = await puppeteer.launch({
		args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"],
	});

	const page = await browser.newPage();

	try {
		// Navigate to requested URL
		await page.goto(url, { waitUntil: "networkidle2" });

		// Create readable stream from page content
		const stream = new Readable({
			read() {},
		});
		stream.push(await page.content());
		stream.push(null);

		// Set response headers
		res.set({
			"Content-Type": "text/html; charset=UTF-8",
			"Transfer-Encoding": "chunked",
		});

		// Stream content to client
		stream.pipe(res);
	} catch (error) {
		console.error(error);
		res.status(500).send("Something went wrong!");
	} finally {
		// Close browser
		await browser.close();
	}
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
