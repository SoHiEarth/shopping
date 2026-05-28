import { supabase } from '../module.js'

function redirectFromRefUsername() {
  const urlParams = new URLSearchParams(window.location.search);
  const refUsername = urlParams.get('ref');

  if (!refUsername) {
    return;
  }

  supabase
    .from('users')
    .select('*')
    .eq('username', refUsername)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Error fetching user:', error);
      } else if (data) {
        if (data.type === 'customer') {
          location.href = '../customer/index.html?username=' + refUsername;
        } else if (data.type === 'seller') {
          location.href = '../seller/index.html?username=' + refUsername;
        } else {
          alert('ユーザーの種類が不明です。');
        }
      }
    });
}

async function signInWithEmail() {
  var username = document.getElementById("username").value;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error) {
    console.error('Error signing in:', error)
    alert('ユーザーが見つかりませんでした。');
  } else {
    console.log('User signed in successfully:', data)
    if (data.type === 'customer') {
      location.href = '../customer/index.html?username=' + username;
    } else if (data.type === 'seller') {
      location.href = '../seller/index.html?username=' + username;
    } else {
      alert('ユーザーの種類が不明です。');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  redirectFromRefUsername();

  document.querySelector('.login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    signInWithEmail();
  });
});