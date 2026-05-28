import { supabase } from '../../module.js'

async function signUpNewUser() {
  var username = document.getElementById('username').value
  var type = document.getElementById('type').value
  const { data, error } = await supabase
    .from('users')
    .insert([
      { username: username, type: type },
    ])

  if (error) {
    console.error('Error adding user:', error)
  } else {
    console.log('User added successfully:', data)
  }
}

document.getElementById('user-add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  signUpNewUser();
  location.href = '../copy-link/index.html?username=' + document.getElementById('username').value;
});