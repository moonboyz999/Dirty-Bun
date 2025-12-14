const STORAGE_KEY = 'counterOrders';
let counterOrders = [];
let counterFilter = 'all';

function loadCounterOrders() {
    const saved = localStorage.getItem(STORAGE_KEY);
    counterOrders = saved ? JSON.parse(saved) : [];
}

function saveCounterOrders() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counterOrders));
}

function setCounterFilter(filter) {
    counterFilter = filter;
    document.querySelectorAll('.counter-filter-btn').forEach(btn => btn.classList.remove('active'));
    const active = document.querySelector(`.counter-filter-btn[data-filter="${filter}"]`);
    if (active) active.classList.add('active');
    renderCounterOrders();
}

function renderCounterOrders() {
    const list = document.getElementById('counterList');
    if (!list) return;

    const filtered = counterOrders.filter(order => {
        if (order.paymentMethod !== 'counter') return false;
        if (counterFilter === 'unpaid') return order.status === 'UNPAID';
        if (counterFilter === 'paid') return order.status === 'PAID';
        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-cart">No counter orders yet.</p>';
        return;
    }

    list.innerHTML = filtered.map(order => {
        const statusClass = order.status === 'PAID' ? 'badge-paid' : 'badge-unpaid';
        const statusLabel = order.status === 'PAID' ? 'Paid' : 'Unpaid';
        const orderTypeLabel = order.orderType === 'pickup' ? 'Pick Up' : 'Take Away';
        return `
            <div class="counter-item">
                <div>
                    <h4>${order.customerName} <span class="badge ${statusClass}">${statusLabel}</span></h4>
                    <p class="meta">Order: ${order.id} • ${orderTypeLabel}</p>
                    <p class="meta">Total: RM ${order.total.toFixed(2)}</p>
                </div>
                ${order.status === 'UNPAID' ? `<button class="pay-btn small" onclick="markCounterPaid('${order.id}')">Mark Paid</button>` : ''}
            </div>
        `;
    }).join('');
}

function markCounterPaid(id) {
    const idx = counterOrders.findIndex(o => o.id === id);
    if (idx >= 0) {
        counterOrders[idx].status = 'PAID';
        saveCounterOrders();
        renderCounterOrders();
    }
}

function refreshOrders() {
    loadCounterOrders();
    renderCounterOrders();
}

// Initialize POS view

document.addEventListener('DOMContentLoaded', () => {
    loadCounterOrders();
    setCounterFilter('all');
});
