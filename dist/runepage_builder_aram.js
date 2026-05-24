import axios, { isAxiosError } from "axios";
import fs from "fs";
import { Agent } from "https";
import { authenticate } from "league-connect";
import promptSync from "prompt-sync";
import { rootDir } from "./config/constants.js";
import { sleep } from "./connection.js";
const prompt = promptSync();
(async () => {
    const credentials = await authenticate({ awaitConnection: true });
    // League uses self-signed certs
    const httpsAgent = new Agent({
        rejectUnauthorized: false,
    });
    const leagueRequest = axios.create({
        baseURL: `https://127.0.0.1:${credentials.port}`,
        httpsAgent,
        headers: {
            Authorization: `Basic ${Buffer.from(`riot:${credentials.password}`).toString("base64")}`,
        },
    });
    console.log(`[DEV TESTING] Connected to league client on port ${credentials.port}\n`);
    // #region Runepage Handling
    const findRunepagesByName = async (query) => {
        if (!query.trim())
            return [];
        try {
            const { data } = await leagueRequest.get("/lol-perks/v1/pages");
            // Normalize data to always be an array
            const runePages = Array.isArray(data) ? data : [data];
            const loweredQuery = query.toLowerCase();
            return runePages.filter((page) => page.name.toLowerCase().includes(loweredQuery));
        }
        catch (err) {
            if (isAxiosError(err)) {
                console.error("[Axios] Couldn't fetch rune pages: ", err.response?.data || err.message);
            }
            else {
                console.error("[Unknown] Couldn't fetch rune pages: ", err);
            }
            return [];
        }
    };
    const createRunepages = async (payload) => {
        try {
            const runePagesAmount = (await leagueRequest.get("/lol-perks/v1/pages"))
                .data.length;
            // Only one rune page
            if (payload.length === 1 && payload[0].name && runePagesAmount < 25) {
                const res = await leagueRequest.post("/lol-perks/v1/pages", payload[0]);
                console.log(`Runepage ${res.data.name} created! Page #${res.data.order}`);
                return;
            }
            // Ensure we wont go over 25 pages, which would throw an error
            const finalRunepagesAmount = runePagesAmount + payload.length;
            const canCreate = finalRunepagesAmount <= 25;
            if (canCreate) {
                for (const page of payload) {
                    await leagueRequest
                        .post("/lol-perks/v1/pages", page)
                        .then(async (res) => {
                        console.log(`Runepage ${res.data.name} created! Page #${res.data.order}`);
                        await sleep(1);
                    });
                }
            }
            else {
                console.log(`Rune pages limit would be exceeded! (25)`);
                console.log(`Your request: ${runePagesAmount} + ${payload.length} (${finalRunepagesAmount})`);
                return;
            }
            console.log("Finished creating all runepages! ");
        }
        catch (err) {
            if (isAxiosError(err)) {
                console.error("Error creating a rune page: ", err.response?.data || err.message);
            }
            else {
                console.error();
            }
        }
    };
    const deleteRunepages = async (query) => {
        try {
            const matches = await findRunepagesByName(query);
            // Only deleting one runepage
            if (matches.length === 1 && matches[0].name) {
                await leagueRequest.delete(`/lol-perks/v1/pages/${matches[0].id}`);
                console.log(`Runepage ${matches[0].name} deleted! (${matches[0].id})`);
                return;
            }
            for (const page of matches) {
                await leagueRequest
                    .delete(`/lol-perks/v1/pages/${page.id}`)
                    .then(async () => {
                    console.log(`Runepage ${page.name} deleted! (${page.id})`);
                    await sleep(1);
                });
            }
            if (matches.length > 0) {
                console.log(`Finished deleting all runepages with the term [${query}]!`);
                return;
            }
            console.log(`No matches found with the term [${query}]`);
        }
        catch (err) {
            if (isAxiosError(err)) {
                console.error("[Axios] Error deleting a rune page: ", err.response?.data || err.message);
            }
            else {
                console.error("[Unknown] Error deleting a rune page: ", err);
            }
        }
    };
    // Decide if we want to use this tool to create or delete runepages
    const intent = prompt("[C]reate or [D]elete?: ").toLowerCase();
    if (intent === "create" || intent === "c") {
        const subDir = rootDir + "/config/";
        const runepagesType = "aram";
        const fileName = `${runepagesType}_runepages.json`;
        const runepagesPayloadDir = subDir + fileName;
        const runepagesPayload = fs.readFileSync(runepagesPayloadDir).toString();
        const RUNEPAGES = JSON.parse(runepagesPayload);
        await createRunepages(RUNEPAGES);
    }
    else if (intent === "delete" || intent === "d") {
        const query = prompt("Searching term: ");
        await deleteRunepages(query);
    }
    // #endregion Runepage Handling
})();
