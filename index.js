const { app, BrowserWindow, ipcMain } = require('electron');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true // Enable Node.js integration
        }
    });

    mainWindow.loadURL(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`);
    
    // Listen for navigation events to handle callbacks
    mainWindow.webContents.on('did-navigate', async (event, newURL) => {
        if (newURL.startsWith(process.env.REDIRECT_URI)) {
            const url = new URL(newURL);
            const code = url.searchParams.get('code');

            if (code) {
                console.log('Authorization code:', code);
                await exchangeCodeForToken(code);
            } else {
                console.error('Authorization code not found.');
            }
        }
    });
}

async function exchangeCodeForToken(code) {
    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Correct content type
        },
        body: new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDIRECT_URI,
        }),
    });

    const data = await response.json();

    if (data.access_token) {
        console.log('Access Token:', data.access_token);
        // You can also fetch user data with the access token
        await fetchUserData(data.access_token);
    } else {
        console.error('Error fetching access token:', data);
    }
}

async function fetchUserData(accessToken) {
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const userData = await userResponse.json();
    console.log('User Data:', userData);
}

// Electron app events
app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});