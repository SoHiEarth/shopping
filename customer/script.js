import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://fqektoozvsosmqqraeog.supabase.co', 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB')

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username') || 'ゲスト';

const state = {
    products: [],
    cartByKey: new Map(),
    cartTotal: 0,
};

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatPrice(value) {
    if (value === null || value === undefined || value === '') {
        return '価格未設定';
    }

    if (typeof value === 'number') {
        return `${value.toLocaleString('ja-JP')}円`;
    }

    const text = String(value);
    return text.includes('円') ? text : `${text}円`;
}

function parsePrice(value) {
    if (typeof value === 'number') {
        return value;
    }

    const numericValue = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function getProductKey(product, index) {
    return String(product.id ?? product.product_id ?? product.sku ?? product.name ?? product.product_name ?? index);
}

function getProductName(product) {
    return product.name ?? product.product_name ?? product.title ?? '商品';
}

function getProductDescription(product) {
    return product.description ?? product.detail ?? product.memo ?? '商品説明はありません。';
}

function getProductImage(product) {
    return product.image_url ?? product.image ?? product.imageUrl ?? 'sample-image.png';
}

function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(value);
    }

    return String(value).replace(/"/g, '\\"');
}

function getDetailCard(productKey) {
    return document.querySelector(`.product-detail-card[data-product-key="${escapeSelectorValue(productKey)}"]`);
}

function updateCartOverview() {
    const cartHeading = document.querySelector('#cart-overview h2');
    if (cartHeading) {
        cartHeading.textContent = `合計金額: ${state.cartTotal.toLocaleString('ja-JP')}円`;
    }
}

function renderProducts(products) {
    const productGrid = document.querySelector('.grid-container');
    if (!productGrid) {
        return;
    }

    productGrid.innerHTML = '';

    products.forEach((product, index) => {
        const productKey = getProductKey(product, index);
        const productName = getProductName(product);
        const productDescription = getProductDescription(product);
        const productImage = getProductImage(product);
        const rawPrice = product.price ?? product.amount;
        const hasPriceSet = rawPrice !== null && rawPrice !== undefined && rawPrice !== '';
        const productPrice = parsePrice(rawPrice ?? 0);
        const productPriceLabel = formatPrice(rawPrice);

        state.cartByKey.set(productKey, {
            productName,
            productPrice,
            hasPriceSet,
        });

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productKey = productKey;
        productCard.innerHTML = `
            <img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}の画像" class="product-image">
            <h2 class="noto-sans-jp-bold">${escapeHtml(productName)}</h2>
            <p>${escapeHtml(productDescription)}</p>
            <p>価格: ${escapeHtml(productPriceLabel)}</p>
        `;
        productCard.addEventListener('click', () => show_details(productKey));

        const detailCard = document.createElement('div');
        detailCard.className = `product-detail-card product-detail-card-${productKey}`;
        detailCard.dataset.productKey = productKey;
        detailCard.innerHTML = `
            <img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}の画像" class="product-detail-image">
            <div class="product-detail-info">
                <div class="product-detail-header">
                    <h2 class="noto-sans-jp-bold">${escapeHtml(productName)}</h2>
                    <button class="close-detail-button" type="button">&times;</button>
                </div>
                <p>${escapeHtml(productDescription)}</p>
                <label class="label">価格</label>
                <input type="text" class="noto-sans-jp-bold input-box" value="${escapeHtml(productPriceLabel)}" readonly>
                <label for="quantity-${escapeHtml(productKey)}" class="label">数量</label>
                <input type="number" class="noto-sans-jp-bold input-box quantity-input" id="quantity-${escapeHtml(productKey)}" min="1" value="1">
                <button class="button add-to-cart-button" type="button">カートに追加</button>
            </div>
        `;

        detailCard.querySelector('.close-detail-button').addEventListener('click', (event) => {
            event.stopPropagation();
            close_details(productKey);
        });

        detailCard.querySelector('.add-to-cart-button').addEventListener('click', () => {
            addToCart(productKey);
        });

        detailCard.addEventListener('click', (event) => {
            if (event.target === detailCard) {
                close_details(productKey);
            }
        });

        productGrid.appendChild(productCard);
        productGrid.appendChild(detailCard);
    });
}

async function loadProducts() {
    const { data, error } = await supabase
        .from('items')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        const productGrid = document.querySelector('.grid-container');
        if (productGrid) {
            productGrid.innerHTML = '<p>商品を読み込めませんでした。</p>';
        }
        return;
    }

    state.products = data ?? [];
    renderProducts(state.products);
    updateCartOverview();
}

function show_details(productKey) {
    const detailCard = getDetailCard(productKey);
    if (detailCard) {
        detailCard.classList.add('show');
    }
}

function close_details(productKey) {
    const detailCard = getDetailCard(productKey);
    if (detailCard) {
        detailCard.classList.remove('show');
    }
}

function addToCart(productKey) {
    const cartItem = state.cartByKey.get(productKey);
    if (!cartItem || !cartItem.hasPriceSet) {
        alert('この商品はまだ価格未設定のため、カートに追加できません。');
        return;
    }

    const detailCard = getDetailCard(productKey);
    const quantityInput = detailCard ? detailCard.querySelector('.quantity-input') : null;
    const quantity = quantityInput ? Math.max(1, parseInt(quantityInput.value, 10) || 1) : 1;
    const itemTotal = (cartItem?.productPrice ?? 0) * quantity;

    state.cartTotal += itemTotal;
    updateCartOverview();

    alert(`${cartItem?.productName ?? '商品'}を${quantity}個カートに追加しました！`);
}

window.show_details = show_details;
window.close_details = close_details;
window.addToCart = addToCart;

window.addEventListener('DOMContentLoaded', () => {
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = `${username}さん`;
    }

    loadProducts();
});