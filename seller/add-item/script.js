import { ensureAnonymousSession, setHeaderUsername, supabase } from '../../module.js'

const anonymousSession = await ensureAnonymousSession()
if (anonymousSession?.user?.id) {
    console.log('Anonymous session ready with user ID:', anonymousSession.user.id)
}

setHeaderUsername('username', 'ゲストさん');

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

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

function initializeAddItemPage() {
    setHeaderUsername('username', 'ゲストさん');

    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', (event) => {
            event.preventDefault();
            addItem();
        });
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeAddItemPage, { once: true });
} else {
    initializeAddItemPage();
}