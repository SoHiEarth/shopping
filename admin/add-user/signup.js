import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://fqektoozvsosmqqraeog.supabase.co', 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB')

async function signUpNewUser() {
  // Add a new user to the "users" table
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