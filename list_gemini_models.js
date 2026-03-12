require('dotenv').config({ path: 'C:/Users/Priscila/Desktop/QG-IA-NOVO/.env' });
const fetch = require('node-fetch');

async function listModels() {
    console.log("Listing models with key:", process.env.GEMINI_API_KEY);
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        if (!res.ok) {
            console.log("Error Status:", res.status);
            console.log("Error Data:", JSON.stringify(data, null, 2));
        } else {
            console.log("Models:", JSON.stringify(data.models.map(m => m.name), null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

listModels();
