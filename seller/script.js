// Parse the username from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Display the username in the header
if (username) {
    document.getElementById('username').textContent = username + 'さん';
} else {
    document.getElementById('username').textContent = 'ゲストさん';
}