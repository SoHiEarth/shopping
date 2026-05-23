// Parse the username from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Display the username in the header
if (username) {
    document.getElementById('username').textContent = username + 'さん';
} else {
    document.getElementById('username').textContent = 'ゲストさん';
}

function show_details(product_name) {
    // Animate the product detail card
    const detailCard = document.querySelector('.product-detail-card-' + product_name);
    if (detailCard) {
        detailCard.classList.add('show');
    }
}

function close_details(product_name) {
    const detailCard = document.querySelector('.product-detail-card-' + product_name);
    if (detailCard) {
        detailCard.classList.remove('show');
    }
}

function addToCart(product_name) {
    const quantityInput = document.querySelector('.product-detail-card-' + product_name + ' .quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    alert(product_name + 'を' + quantity + '個カートに追加しました！');
}