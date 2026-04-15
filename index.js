// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import move from "./main.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
const config = {
	apiversion: "1",
	author: "PreV1",
	color: "#3479b1",
	head: "all-seeing",
	tail: "mystic-moon",
};

app.get("/", (req, res) => {
	res.json(config);
});

app.get("/debug", (req, res) => {
	res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/start", (req, res) => {
	res.sendStatus(200);
});

//TODO: respond to POST requests on "/move". Your response should be an object with a "move" property and optionally
//      a "shout" property. The request body again contains objects representing the game state
//      https://docs.battlesnake.com/api/requests/move
app.post("/move", (req, res) => {
	res.json(move(req.body))
})

//TODO: respond to POST requests on "/end", which signals the end of a game. Your response itself is ignored,
//      but must have status code "200" the request body will contain objects representing the game
//      https://docs.battlesnake.com/api/requests/end
app.post("/end", (req, res) => {
	res.sendStatus(200);
});

const host = "0.0.0.0";
const port = process.env.PORT || 8000;

app.listen(port, host, () => {
	console.log(`Running Battlesnake at http://${host}:${port}...`);
});
