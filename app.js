const express = require("express");
const app = express();
const ytdl = require('ytdl-core');
const request = require("request");
const puppeteer = require('puppeteer');
const { Readable } = require('stream');


// Set up a proxy route for the YouTube page
app.get("/", (req, res) => {
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
app.use("*",(req,res)=>{
   const url = req.query.url;

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  try {
    // Navigate to requested URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Create readable stream from page content
    const stream = new Readable({
      read() {}
    });
    stream.push(await page.content());
    stream.push(null);

    // Set response headers
    res.set({
      'Content-Type': 'text/html; charset=UTF-8',
      'Transfer-Encoding': 'chunked'
    });

    // Stream content to client
    stream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong!');
  } finally {
    // Close browser
    await browser.close();
  }

})

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
