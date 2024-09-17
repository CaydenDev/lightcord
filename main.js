// Import necessary modules from Electron and Node.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs'); 
const axios = require('axios'); // Import axios for making HTTP requests

// Load environment variables from .env file
dotenv.config();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Preload script for IPC communication
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    const htmlFilePath = path.join(__dirname, 'public', 'index.html');
    
    // Load the HTML file if it exists
    if (fs.existsSync(htmlFilePath)) {
        mainWindow.loadFile(htmlFilePath);
    } else {
        console.error('The index.html file was not found.');
    }

    // Listen for login requests from the renderer process
    ipcMain.on('login', (event) => {
        console.log('IPC message received: login');
        const oauthURL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=identify`;
        console.log('Redirecting to OAuth URL:', oauthURL);
        mainWindow.loadURL(oauthURL); // Load the OAuth URL

        // Listen for the redirect back to the redirect URI
        mainWindow.webContents.on('did-navigate', async (event, newURL) => {
            if (newURL.startsWith(process.env.REDIRECT_URI)) {
                const url = new URL(newURL);
                const code = url.searchParams.get('code');

                if (code) {
                    console.log('Authorization code received:', code);
                    await exchangeCodeForToken(code); // Call function to exchange code for token
                    mainWindow.close(); // Optionally close the login window
                } else {
                    console.error('No authorization code was returned.');
                }
            }
        });
    });
}

// Function to exchange the code for an access token
async function exchangeCodeForToken(code) {
    const tokenURL = `https://discord.com/api/oauth2/token`;

    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET); // Ensure this is stored in your environment variables
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.REDIRECT_URI);

    try {
        const response = await axios.post(tokenURL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log('Access Token:', response.data.access_token);
        // You can now use the access token to make authenticated requests on behalf of the user
    } catch (error) {
        console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});