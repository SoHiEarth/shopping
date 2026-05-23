const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

document.getElementById('copy-link-input').value = 'https://kotaro.studio/shopping/login/index.html?ref=' + username;

document.getElementById('copy-link-button').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('copy-link-input').value)
    .then(() => {
      alert('リンクがコピーされました！');
    })
    .catch(err => {
      console.error('リンクのコピーに失敗しました:', err);
    });
});