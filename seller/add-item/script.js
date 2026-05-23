import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://fqektoozvsosmqqraeog.supabase.co', 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB')

// Parse the username from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Display the username in the header
if (username) {
    document.getElementById('username').textContent = username + 'さん';
} else {
    document.getElementById('username').textContent = 'ゲストさん';
    username = 'ゲスト';
}

async function addItem() {
    var itemName = document.getElementById('item-name').value;
    var itemStock = document.getElementById('item-stock').value;
    var itemDescription = document.getElementById('item-description').value;
    const { data, error } = await supabase.from('items')
        .insert([
            { name: itemName, stock: itemStock, description: itemDescription, seller: username },
        ]);
    if (error) {
        console.error('Error adding item:', error);
    } else {
        alert('商品が追加されました。');
        document.getElementById('item-name').value = '';
        document.getElementById('item-stock').value = '';
        document.getElementById('item-description').value = '';
    }
}

document.getElementById('add-item-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addItem();
});