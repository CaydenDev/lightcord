const { ipcRenderer } = require('electron');

// Add an event listener to the login button
document.getElementById('loginButton').addEventListener('click', () => {
    console.log('Login button clicked');
    ipcRenderer.send('login'); // Send the 'login' message to the main process
    console.log("Sent 'login' message to main process.");
});