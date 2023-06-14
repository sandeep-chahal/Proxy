const puppeteer = require("puppeteer");
const WebSocket = require("ws");

async function startServer() {
	// Launch Puppeteer browser
	const browser = await puppeteer.launch({
		args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"],
	});

	// Create WebSocket server
	const wss = new WebSocket.Server({ port: 8080 });

	// Handle incoming WebSocket connections
	wss.on("connection", async (ws) => {
		try {
			// Create new page in Puppeteer browser
			const page = await browser.newPage();

			// Navigate to desired URL
			await page.goto("https://www.youtube.com/watch?v=nEQHiJVH79o?autplay=1");

			// Forward any user input received via WebSocket to the Puppeteer page
			ws.on("message", async (data) => {
				const { type, payload } = JSON.parse(data);
				switch (type) {
					case "click":
						await page.click(payload.selector);
						break;
					case "textInput":
						await page.type(payload.selector, payload.text);
						break;
					// Add more cases for other types of user input as needed
				}
			});

			// Continuously capture screenshots of the Puppeteer page and send them back to the client via WebSocket
			setInterval(async () => {
				const screenshotData = await page.screenshot({ encoding: "base64" });
				ws.send(JSON.stringify({ type: "screenshot", payload: screenshotData }));
			}, 1000);
		} catch (error) {
			console.error(error);
			ws.close();
		}
	});
}

startServer();

const express = require("express");
const app = express();
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
