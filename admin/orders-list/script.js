import { escapeHtml, formatPrice, supabase } from '../../module.js'

let warningDisplayed = false;
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const sortButtons = {
  name: 'sort-by-name',
  price: 'sort-by-price',
  totalOrders: 'sort-by-total-orders',
  totalPrice: 'sort-by-total-price',
};

const state = {
  products: [],
  sortMode: 'name',
};

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function validateToken() {
  if (!token) {
    window.location.href = '../../login/index.html';
    return false;
  }

  const hash = await sha256(token);
  const { data, error } = await supabase
    .from('tokens')
    .select('id')
    .eq('hash', hash)
    .single();

  if (error || !data) {
    window.location.href = '../../login/index.html';
    return false;
  }

  localStorage.setItem('adminToken', token);
  return true;
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

function getOrderEntries(orders) {
  return String(orders ?? '')
    .split(/\r?\n/)
    .map(parseOrderEntry)
    .filter(Boolean);
}

function getCustomerNames(products) {
  const customerNameSet = new Set();

  products.forEach((item) => {
    if (item.customerQuantities instanceof Map) {
      item.customerQuantities.forEach((_, customerName) => {
        customerNameSet.add(customerName);
      });
      return;
    }

    getOrderEntries(item.orders).forEach((order) => {
      customerNameSet.add(order.customerName);
    });
  });

  return [...customerNameSet].sort((left, right) => left.localeCompare(right, 'ja'));
}

function getOrderQuantityByCustomer(orders) {
  return getOrderEntries(orders).reduce((orderMap, order) => {
    orderMap.set(order.customerName, order.quantity);
    return orderMap;
  }, new Map());
}

function getOrderValueByCustomer(orders, productPrice) {
  const price = Number(productPrice);

  return getOrderEntries(orders).reduce((orderMap, order) => {
    orderMap.set(order.customerName, Number.isFinite(price) ? price * order.quantity : null);
    return orderMap;
  }, new Map());
}

function getTotalOrderCount(orders) {
  return getOrderEntries(orders).reduce((sum, order) => sum + order.quantity, 0);
}

function getTotalOrderCountBySeller(products) {
  return products.reduce((sellerOrderCounts, product) => {
    const sellerName = String(product.seller ?? '').trim();
    const orderCount = getTotalOrderCount(product.orders);
    sellerOrderCounts.set(sellerName, (sellerOrderCounts.get(sellerName) ?? 0) + orderCount);
    return sellerOrderCounts;
  }, new Map());
}

function getSellerSummaries(products) {
  const sellerSummaryMap = new Map();

  products.forEach((product) => {
    const sellerName = String(product.seller ?? '').trim() || '未設定';
    const price = Number(product.price);
    const hasPrice = Number.isFinite(price);
    const orderEntries = getOrderEntries(product.orders);

    let summary = sellerSummaryMap.get(sellerName);
    if (!summary) {
      summary = {
        sellerName,
        customerQuantities: new Map(),
        customerValues: new Map(),
        totalOrders: 0,
        totalValue: 0,
        firstProductId: product.id,
      };
      sellerSummaryMap.set(sellerName, summary);
    }

    orderEntries.forEach((order) => {
      summary.totalOrders += order.quantity;

      summary.customerQuantities.set(
        order.customerName,
        (summary.customerQuantities.get(order.customerName) ?? 0) + order.quantity,
      );

      if (!hasPrice) {
        summary.customerValues.set(order.customerName, null);
        return;
      }

      if (summary.customerValues.get(order.customerName) === null) {
        return;
      }

      summary.customerValues.set(
        order.customerName,
        (summary.customerValues.get(order.customerName) ?? 0) + (price * order.quantity),
      );
    });

    if (hasPrice) {
      summary.totalValue += orderEntries.reduce((sum, order) => sum + (price * order.quantity), 0);
    }
  });

  return [...sellerSummaryMap.values()];
}

function compareProductsByName(leftProduct, rightProduct) {
  return String(leftProduct.name ?? '').localeCompare(String(rightProduct.name ?? ''), 'ja');
}

function compareProductsByPrice(leftProduct, rightProduct) {
  const leftPrice = Number.isFinite(Number(leftProduct.price)) ? Number(leftProduct.price) : Number.POSITIVE_INFINITY;
  const rightPrice = Number.isFinite(Number(rightProduct.price)) ? Number(rightProduct.price) : Number.POSITIVE_INFINITY;

  if (leftPrice !== rightPrice) {
    return leftPrice - rightPrice;
  }

  return compareProductsByName(leftProduct, rightProduct);
}

function compareSellerSummariesByTotalOrders(leftSummary, rightSummary) {
  const leftOrders = Number(leftSummary.totalOrders ?? 0);
  const rightOrders = Number(rightSummary.totalOrders ?? 0);

  if (leftOrders !== rightOrders) {
    return rightOrders - leftOrders;
  }

  return String(leftSummary.sellerName ?? '').localeCompare(String(rightSummary.sellerName ?? ''), 'ja');
}

function compareSellerSummariesByTotalPrice(leftSummary, rightSummary) {
  const leftTotal = Number(leftSummary.totalValue ?? 0);
  const rightTotal = Number(rightSummary.totalValue ?? 0);

  if (leftTotal !== rightTotal) {
    return rightTotal - leftTotal;
  }

  return String(leftSummary.sellerName ?? '').localeCompare(String(rightSummary.sellerName ?? ''), 'ja');
}

function getSortedProducts() {
  const products = [...state.products];

  switch (state.sortMode) {
    case 'price':
      return products.sort(compareProductsByPrice);
    case 'totalOrders':
      return getSellerSummaries(products).sort(compareSellerSummariesByTotalOrders);
    case 'totalPrice':
      return getSellerSummaries(products).sort(compareSellerSummariesByTotalPrice);
    case 'name':
    default:
      return products.sort(compareProductsByName);
  }
}

function updateSortButtonState() {
  Object.entries(sortButtons).forEach(([mode, buttonId]) => {
    const button = document.getElementById(buttonId);
    if (!button) {
      return;
    }

    button.dataset.active = String(mode === state.sortMode);
    button.setAttribute('aria-pressed', String(mode === state.sortMode));
  });
}

function setSortMode(sortMode) {
  state.sortMode = sortMode;
  updateSortButtonState();
  renderOrdersTable();
}

function openEditPage(productId) {
  const url = `../edit/index.html?id=${encodeURIComponent(productId)}`;
  window.open(url, '_blank');
}

function renderCustomerHeader(sortMode, customerNames) {
  const customerNamesRow = document.getElementById('customer-names');
  if (!customerNamesRow) {
    return;
  }

  const isSellerSummaryMode = sortMode === 'totalOrders' || sortMode === 'totalPrice';

  const baseHeaders = isSellerSummaryMode
    ? ['<th class="col-seller">販売者</th>']
    : ['<th class="col-seller">販売者</th>', '<th class="col-product">商品名</th>', '<th class="col-price">価格</th>'];

  customerNamesRow.innerHTML = `${baseHeaders.join('')}${customerNames.map((customerName) => `<th class="customer-col">${escapeHtml(customerName)}</th>`).join('')}`;
}

function renderOrdersTable() {
  const ordersTableBody = document.getElementById('orders-table-body');
  const warningList = document.getElementById('warning-list');
  const warningContainer = document.getElementById('warning-container');

  if (!ordersTableBody || !warningList || !warningContainer) {
    return;
  }

  const sellers = getSortedProducts();
  const customerNames = getCustomerNames(sellers);
  renderCustomerHeader(state.sortMode, customerNames);

  ordersTableBody.innerHTML = '';
  warningList.innerHTML = '';
  warningDisplayed = false;

  state.products.forEach((product) => {
    if (product.price === null) {
      const warningItem = document.createElement('li');
      warningItem.textContent = product.name;
      warningList.appendChild(warningItem);
      warningDisplayed = true;
    }
  });

  const isSellerSummaryMode = state.sortMode === 'totalOrders' || state.sortMode === 'totalPrice';
  if (isSellerSummaryMode) {
    sellers.forEach((sellerSummary) => {
      const row = document.createElement('tr');
      row.dataset.productId = String(sellerSummary.firstProductId ?? '');
      row.id = `seller-${sellerSummary.sellerName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      row.innerHTML = `
        <td class="col-seller">${escapeHtml(sellerSummary.sellerName)}</td>
        ${customerNames
          .map((customerName) => {
            if (state.sortMode === 'totalOrders') {
              return `<td class="customer-col">${sellerSummary.customerQuantities.get(customerName) ?? 0}</td>`;
            }

            if (!sellerSummary.customerValues.has(customerName)) {
              return `<td class="customer-col">${escapeHtml(formatPrice(0))}</td>`;
            }
            const orderValue = sellerSummary.customerValues.get(customerName);
            return `<td class="customer-col">${orderValue === null ? '未設定' : escapeHtml(formatPrice(orderValue))}</td>`;
          })
          .join('')}
      `;
      ordersTableBody.appendChild(row);
    });

    warningContainer.hidden = !warningDisplayed;
    return;
  }

  sellers.forEach((product) => {
    const orderQuantityByCustomer = getOrderQuantityByCustomer(product.orders);
    const orderValueByCustomer = getOrderValueByCustomer(product.orders, product.price);
    const row = document.createElement('tr');
    row.dataset.productId = String(product.id ?? '');
    row.id = `product${product.id}`;
    row.innerHTML = `
      <td class="col-seller">${escapeHtml(product.seller)}</td>
      <td class="col-product">${escapeHtml(product.name)}</td>
      <td class="col-price">${formatPrice(product.price)}</td>
      ${customerNames
        .map((customerName) => {
          if (state.sortMode === 'price') {
            if (!orderValueByCustomer.has(customerName)) {
              return `<td class="customer-col">${escapeHtml(formatPrice(0))}</td>`;
            }

            const orderValue = orderValueByCustomer.get(customerName);
            return `<td class="customer-col">${orderValue === null ? '未設定' : escapeHtml(formatPrice(orderValue))}</td>`;
          }

          return `<td class="customer-col">${orderQuantityByCustomer.get(customerName) ?? 0}</td>`;
        })
        .join('')}
    `;
    ordersTableBody.appendChild(row);
  });

  warningContainer.hidden = !warningDisplayed;
}

async function loadOrdersTable() {
  const { data: products, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  state.products = products ?? [];
  renderOrdersTable();
}

async function initializeAdminDashboard() {
  const isTokenValid = await validateToken();
  if (!isTokenValid) {
    return;
  }

  const productTableBody = document.getElementById('orders-table-body');
  if (productTableBody) {
    productTableBody.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      const productId = row?.dataset.productId;
      if (productId) {
        openEditPage(productId);
      }
    });
  }

  Object.entries(sortButtons).forEach(([mode, buttonId]) => {
    const button = document.getElementById(buttonId);
    button?.addEventListener('click', () => setSortMode(mode));
  });

  updateSortButtonState();
  await loadOrdersTable();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
  }, { once: true });
} else {
  initializeAdminDashboard();
}