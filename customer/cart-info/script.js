import { ensureAnonymousSession, escapeHtml, formatPrice, setHeaderUsername, supabase } from '../../module.js'

const state = {
    orders: [],
    totalAmount: 0,
};

function getCustomerName() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username') ?? 'ゲストさん';
}

function parsePrice(value) {
    if (typeof value === 'number') {
        return value;
    }

    const numericValue = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function parseOrderEntry(entry) {
    const trimmedEntry = String(entry ?? '').trim();
    if (!trimmedEntry || !trimmedEntry.includes(':')) {
        return null;
    }

    const [customerName, quantityText] = trimmedEntry.split(':');
    const quantity = Number.parseInt(quantityText, 10);

    if (!customerName || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
    }

    return {
        customerName: customerName.trim(),
        quantity,
    };
}

function collectCustomerOrders(items, customerName, itemIndex = 0, orderIndex = 0, collected = []) {
    if (itemIndex >= items.length) {
        return collected;
    }

    const item = items[itemIndex];
    const orderLines = String(item.orders ?? '')
        .split(/\r?\n/)
        .filter(Boolean);

    if (orderIndex >= orderLines.length) {
        return collectCustomerOrders(items, customerName, itemIndex + 1, 0, collected);
    }

    const parsedOrder = parseOrderEntry(orderLines[orderIndex]);
    if (parsedOrder && parsedOrder.customerName === customerName) {
        const price = parsePrice(item.price ?? item.amount);
        collected.push({
            itemName: item.name ?? item.product_name ?? '商品',
            price,
            quantity: parsedOrder.quantity,
            lineTotal: price * parsedOrder.quantity,
        });
    }

    return collectCustomerOrders(items, customerName, itemIndex, orderIndex + 1, collected);
}

function renderOrders() {
    const container = document.getElementById('cart-items-container');
    const totalHeading = document.querySelector('#cart-overview h2');

    if (!container || !totalHeading) {
        return;
    }

    if (!state.orders.length) {
        container.innerHTML = '<p>このユーザーの注文はまだありません。</p>';
        totalHeading.textContent = '合計金額: 0円';
        return;
    }

    container.innerHTML = state.orders
        .map(order => `
            <div class="order-item">
                <h2 class="noto-sans-jp-bold">${escapeHtml(order.itemName)}</h2>
                <p>単価: ${escapeHtml(formatPrice(order.price))}</p>
                <p>数量: ${escapeHtml(String(order.quantity))}</p>
                <p>小計: ${escapeHtml(formatPrice(order.lineTotal))}</p>
            </div>
        `)
        .join('');

    totalHeading.textContent = `合計金額: ${state.totalAmount.toLocaleString('ja-JP')}円`;
}

async function loadCustomerOrders() {
    const customerName = getCustomerName();

    const session = await ensureAnonymousSession();
    if (!session?.user?.id) {
        console.error('Anonymous session could not be established before loading cart info.');
    }

    const { data, error } = await supabase
        .from('items')
        .select('name, product_name, price, amount, orders');

    if (error) {
        console.error('Error fetching orders:', error);
        const container = document.getElementById('cart-items-container');
        if (container) {
            container.innerHTML = '<p>注文情報を読み込めませんでした。</p>';
        }
        return;
    }

    state.orders = collectCustomerOrders(data ?? [], customerName);
    state.totalAmount = state.orders.reduce((sum, order) => sum + order.lineTotal, 0);

    renderOrders();
}

function initializeCartInfoPage() {
    setHeaderUsername('username', 'ゲストさん');
    loadCustomerOrders();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeCartInfoPage, { once: true });
} else {
    initializeCartInfoPage();
}