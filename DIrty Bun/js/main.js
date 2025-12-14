'use strict';

// -------------------------------------
// State & configuration
// -------------------------------------
let currentItem = { name: '', price: 0, description: '' };
let cart = [];
let counterOrders = [];
let editIndex = -1; // Track if we're editing an existing item

const drinkOptions = {
    'Soft Drinks': ['Coca-Cola', 'Pepsi', 'Fanta', 'Sprite'],
    'Fresh Juices': ['Orange Juice', 'Apple Juice', 'Tropical Blend', 'Watermelon Juice'],
    'Milkshakes': ['Chocolate', 'Vanilla', 'Strawberry', 'Cookies & Cream'],
    'Draft Beer': ['Tiger', 'Heineken', 'Carlsberg'],
    'House Wine': ['Red Wine', 'White Wine', 'Rosé'],
    'Cocktails': ['Mojito', 'Margarita', 'Long Island', 'Whiskey Sour']
};

// -------------------------------------
// Navigation helpers
// -------------------------------------
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// -------------------------------------
// Order modal
// -------------------------------------
function openOrderModal(itemName, itemPrice, itemDescription = '', itemType = 'burger') {
    const clickTarget = typeof event !== 'undefined' && event?.currentTarget ? event.currentTarget : null;
    if (clickTarget) clickTarget.classList.add('clicked');

    setTimeout(() => {
        currentItem = { name: itemName, price: itemPrice, description: itemDescription, type: itemType };
        document.getElementById('modalItemName').textContent = itemName;
        document.getElementById('modalItemDescription').textContent = itemDescription;
        document.getElementById('quantity').value = 1;

        const mealTypeSection = document.getElementById('mealTypeSection');
        const drinkOptionsSection = document.getElementById('drinkOptionsSection');

        if (itemType === 'burger') {
            mealTypeSection.style.display = 'block';
            drinkOptionsSection.style.display = 'none';
            document.querySelector('input[name="mealType"][value="set"]').checked = true;
            document.getElementById('drinkSelect').value = '0';

            // Reset sides; default to Fries
            document.querySelectorAll('input[name="sides"]').forEach(cb => {
                cb.checked = cb.value === '0';
            });

            updateMealType();
        } else if (itemType === 'drink') {
            mealTypeSection.style.display = 'none';
            document.getElementById('drinkSection').style.display = 'none';
            document.getElementById('sideSection').style.display = 'none';
            drinkOptionsSection.style.display = 'block';
            setupDrinkOptions(itemName);
        } else {
            mealTypeSection.style.display = 'none';
            drinkOptionsSection.style.display = 'none';
            document.getElementById('drinkSection').style.display = 'none';
            document.getElementById('sideSection').style.display = 'none';
        }

        document.getElementById('orderModal').style.display = 'flex';
        updateTotal();

        if (clickTarget) setTimeout(() => clickTarget.classList.remove('clicked'), 400);
    }, 200);
}

function setupDrinkOptions(drinkName) {
    const container = document.getElementById('drinkOptionsContainer');
    const options = drinkOptions[drinkName] || [];

    container.innerHTML = '';
    options.forEach((option, index) => {
        container.innerHTML += `
            <label class="radio-label">
                <input type="radio" name="drinkOption" value="${option}" ${index === 0 ? 'checked' : ''}>
                ${option}
            </label>
        `;
    });
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    const modalContent = document.querySelector('.modal-content');

    modalContent.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modalContent.classList.remove('closing');
        editIndex = -1;
    }, 300);
}

function updateMealType() {
    const mealType = document.querySelector('input[name="mealType"]:checked').value;
    const drinkSection = document.getElementById('drinkSection');
    const sideSection = document.getElementById('sideSection');
    const modalContent = document.querySelector('.modal-content');

    modalContent.style.transform = 'scale(0.98)';
    setTimeout(() => {
        const isSet = mealType === 'set';
        drinkSection.style.display = isSet ? 'block' : 'none';
        sideSection.style.display = isSet ? 'block' : 'none';
        setTimeout(() => { modalContent.style.transform = 'scale(1)'; }, 100);
    }, 300);

    updateTotal();
}

function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    let itemPrice = currentItem.price;

    if (currentItem.type === 'burger') {
        const mealType = document.querySelector('input[name="mealType"]:checked').value;
        if (mealType === 'set') {
            const drinkPrice = parseFloat(document.getElementById('drinkSelect').value) || 0;
            let sidesPrice = 0;
            document.querySelectorAll('input[name="sides"]:checked').forEach(side => {
                sidesPrice += parseFloat(side.value) || 0;
            });
            itemPrice += drinkPrice + sidesPrice;
        }
    }

    const total = itemPrice * quantity;
    document.getElementById('totalPrice').textContent = 'RM ' + total.toFixed(2);
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value, 10) > 1) {
        input.value = parseInt(input.value, 10) - 1;
        updateTotal();
    }
}

function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value, 10) + 1;
    updateTotal();
}

function addToCart() {
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    let itemPrice = currentItem.price;
    let drink = 'None';
    let side = 'None';
    let mealType = 'Item';
    let itemName = currentItem.name;

    if (currentItem.type === 'burger') {
        const selectedMealType = document.querySelector('input[name="mealType"]:checked').value;
        mealType = selectedMealType === 'set' ? 'Set Meal' : 'À la carte';

        if (selectedMealType === 'set') {
            const drinkSelect = document.getElementById('drinkSelect');
            const drinkPrice = parseFloat(drinkSelect.value) || 0;
            drink = drinkSelect.options[drinkSelect.selectedIndex].text;

            const selectedSides = document.querySelectorAll('input[name="sides"]:checked');
            const sidesList = [];
            let sidesPrice = 0;
            selectedSides.forEach(sideCheckbox => {
                sidesList.push(sideCheckbox.getAttribute('data-name'));
                sidesPrice += parseFloat(sideCheckbox.value) || 0;
            });

            side = sidesList.length > 0 ? sidesList.join(', ') : 'None';
            itemPrice += drinkPrice + sidesPrice;
        }
    } else if (currentItem.type === 'drink') {
        const selectedOption = document.querySelector('input[name="drinkOption"]:checked');
        if (selectedOption) itemName = itemName + ' - ' + selectedOption.value;
    }

    const total = itemPrice * quantity;
    const cartItem = { name: itemName, quantity, mealType, drink, side, total };

    if (editIndex >= 0) {
        cart[editIndex] = cartItem;
        editIndex = -1;
    } else {
        cart.push(cartItem);
    }

    updateCartDisplay();
    closeOrderModal();
}

// -------------------------------------
// Cart management
// -------------------------------------
function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCountSpan = document.getElementById('cartCount');
    const cartTotalSpan = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartCountSpan.textContent = '0';
        cartTotalSpan.textContent = 'RM 0.00';
        return;
    }

    let html = '';
    let grandTotal = 0;

    cart.forEach((item, index) => {
        grandTotal += item.total;
        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>${item.name} x${item.quantity}</h4>
                    ${item.mealType !== 'Item' ? `<span class="badge">${item.mealType}</span>` : ''}
                    ${item.drink !== 'None' ? `<p>Drink: ${item.drink}</p>` : ''}
                    ${item.side !== 'None' ? `<p>Side: ${item.side}</p>` : ''}
                </div>
                <div class="cart-item-price">
                    <span>RM ${item.total.toFixed(2)}</span>
                    <button class="edit-btn" onclick="editCartItem(${index})" title="Edit">✏️</button>
                    <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
                </div>
            </div>
        `;
    });

    cartItemsDiv.innerHTML = html;
    cartCountSpan.textContent = cart.length;
    cartTotalSpan.textContent = 'RM ' + grandTotal.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function editCartItem(index) {
    const item = cart[index];
    editIndex = index;
    const baseName = item.name.split(' - ')[0];

    const menuItems = {
        'Classic Burger': { price: 39.90, type: 'burger', desc: 'Juicy beef patty, lettuce, tomato, onion, pickles, and our special sauce' },
        'Cheese Deluxe': { price: 52.90, type: 'burger', desc: 'Double beef patties with melted cheddar, bacon, and crispy onion rings' },
        'BBQ Bacon Burger': { price: 48.90, type: 'burger', desc: 'Smoky BBQ sauce, crispy bacon, cheddar cheese, and caramelized onions' },
        'Mushroom Swiss': { price: 46.90, type: 'burger', desc: 'Sautéed mushrooms, Swiss cheese, garlic aioli, and arugula' },
        'Spicy Jalapeño': { price: 44.90, type: 'burger', desc: 'Jalapeños, pepper jack cheese, spicy mayo, and crispy lettuce' },
        'Veggie Burger': { price: 42.90, type: 'burger', desc: 'Plant-based patty, avocado, sprouts, tomato, and herb sauce' },
        'Soft Drinks': { price: 6.90, type: 'drink', desc: 'Coca-Cola, Sprite, Fanta, or Pepsi' },
        'Fresh Juices': { price: 12.90, type: 'drink', desc: 'Orange, apple, or tropical fruit blend' },
        'Milkshakes': { price: 15.90, type: 'drink', desc: 'Chocolate, vanilla, strawberry, or cookies & cream' },
        'Draft Beer': { price: 18.90, type: 'drink', desc: 'Tiger, Heineken, or Carlsberg (330ml)' },
        'House Wine': { price: 22.90, type: 'drink', desc: 'Red or white wine by the glass' },
        'Cocktails': { price: 28.90, type: 'drink', desc: 'Mojito, Margarita, Long Island, or Whiskey Sour' },
        'French Fries': { price: 8.90, type: 'side', desc: 'Crispy golden fries with a sprinkle of sea salt' },
        'Chicken Nuggets': { price: 12.90, type: 'side', desc: '6 pieces of crispy, golden chicken nuggets' },
        'Onion Rings': { price: 10.90, type: 'side', desc: 'Crispy battered onion rings with tangy dipping sauce' },
        'Cheesy Wedges': { price: 14.90, type: 'side', desc: 'Potato wedges loaded with melted cheese and bacon bits' }
    };

    const menuItem = menuItems[baseName];
    if (menuItem) {
        currentItem = { name: baseName, price: menuItem.price, description: menuItem.desc, type: menuItem.type };
    }

    document.getElementById('modalItemName').textContent = baseName;
    document.getElementById('modalItemDescription').textContent = menuItem ? menuItem.desc : '';
    document.getElementById('quantity').value = item.quantity;

    const mealTypeSection = document.getElementById('mealTypeSection');
    const drinkOptionsSection = document.getElementById('drinkOptionsSection');

    if (menuItem && menuItem.type === 'burger') {
        mealTypeSection.style.display = 'block';
        drinkOptionsSection.style.display = 'none';
        document.querySelector(`input[name="mealType"][value="${item.mealType === 'Set Meal' ? 'set' : 'alacarte'}"]`).checked = true;
        updateMealType();
    } else if (menuItem && menuItem.type === 'drink') {
        mealTypeSection.style.display = 'none';
        document.getElementById('drinkSection').style.display = 'none';
        document.getElementById('sideSection').style.display = 'none';
        drinkOptionsSection.style.display = 'block';
        setupDrinkOptions(baseName);

        setTimeout(() => {
            const selectedOption = item.name.split(' - ')[1];
            if (selectedOption) {
                const radioBtn = document.querySelector(`input[name="drinkOption"][value="${selectedOption}"]`);
                if (radioBtn) radioBtn.checked = true;
            }
        }, 100);
    } else {
        mealTypeSection.style.display = 'none';
        drinkOptionsSection.style.display = 'none';
        document.getElementById('drinkSection').style.display = 'none';
        document.getElementById('sideSection').style.display = 'none';
    }

    document.getElementById('orderModal').style.display = 'flex';
    updateTotal();
}

function toggleCart() {
    document.getElementById('cartPanel').classList.toggle('open');
}

// -------------------------------------
// Payment flow
// -------------------------------------
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    openPaymentModal();
}

function openPaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        updatePaymentSummary();
        paymentModal.style.display = 'flex';
    }
}

function updatePaymentSummary() {
    const summaryDiv = document.getElementById('paymentSummary');
    const totalSpan = document.getElementById('paymentTotal');

    let html = '';
    let grandTotal = 0;

    cart.forEach(item => {
        grandTotal += item.total;
        html += `
            <div class="summary-item">
                <span>${item.name} x${item.quantity}</span>
                <span>RM ${item.total.toFixed(2)}</span>
            </div>
        `;
    });

    summaryDiv.innerHTML = html;
    totalSpan.textContent = 'RM ' + grandTotal.toFixed(2);
}

function updateOrderType() {
    // Reserved for future order-type specific logic
    document.querySelector('input[name="orderType"]:checked').value;
}

function loadCounterOrders() {
    const saved = localStorage.getItem('counterOrders');
    counterOrders = saved ? JSON.parse(saved) : [];
}

function saveCounterOrders() {
    localStorage.setItem('counterOrders', JSON.stringify(counterOrders));
}

// POS helper stubs (rendering handled in counter-pos.html)
function renderCounterOrders() {}
function setCounterFilter() {}
function markCounterPaid() {}
function toggleCounterPanel() {}

function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) paymentModal.style.display = 'none';
}

function processPayment() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    const customerName = document.getElementById('customerName').value.trim();

    if (!customerName) {
        alert('Please enter your name');
        return;
    }

    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }

    if (!orderType) {
        alert('Please select order type (Pick Up or Take Away)');
        return;
    }

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const orderNumber = 'DB' + Date.now().toString().slice(-6);
    const orderTypeLabel = orderType === 'pickup' ? '🍔 Pick Up' : '🛍️ Take Away';

    const orderRecord = {
        id: orderNumber,
        customerName,
        orderType,
        paymentMethod,
        total: cartTotal,
        status: paymentMethod === 'counter' ? 'UNPAID' : 'PAID',
        createdAt: new Date().toISOString()
    };
    counterOrders.push(orderRecord);
    saveCounterOrders();
    renderCounterOrders();

    let message = `
✅ Order Confirmed!

Order Number: ${orderNumber}
Customer Name: ${customerName}
Order Type: ${orderTypeLabel}
Payment Method: ${getPaymentMethodLabel(paymentMethod)}
Total Amount: RM ${cartTotal.toFixed(2)}
`;

    if (paymentMethod === 'duitnow') {
        message += `
✓ DuitNow QR payment confirmed
Transaction ID: DUIT-${Date.now().toString().slice(-6)}
`;
    } else if (paymentMethod === 'counter') {
        message += `
📍 Counter Payment:
Please proceed to the counter to pay.
Payment at Counter: RM ${cartTotal.toFixed(2)}
`;
    }

    message += `
Thank you for your order! 🍔`;
    alert(message);

    cart = [];
    updateCartDisplay();
    closePaymentModal();
    toggleCart();
}

function getPaymentMethodLabel(method) {
    const labels = { duitnow: '📱 DuitNow QR', counter: '💵 Pay at Counter' };
    return labels[method] || method;
}

function togglePaymentFields() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const duitnowContainer = document.getElementById('duitnowContainer');
    const cashContainer = document.getElementById('cashContainer');

    duitnowContainer.style.display = 'none';
    cashContainer.style.display = 'none';

    if (paymentMethod === 'duitnow') {
        duitnowContainer.style.display = 'block';
        generateDuitNowDetails();
    } else if (paymentMethod === 'counter') {
        cashContainer.style.display = 'block';
    }
}

function generateDuitNowDetails() {
    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const txnId = 'DUIT-' + Date.now().toString().slice(-6);
    document.getElementById('duitnowTxnId').textContent = txnId;
    document.getElementById('duitnowAmount').textContent = 'RM ' + cartTotal.toFixed(2);
}

function formatCVV(input) {
    input.value = input.value.replace(/\D/g, '').slice(0, 3);
}

// -------------------------------------
// Menu filtering & search
// -------------------------------------
function filterMenu(category) {
    const items = document.querySelectorAll('.menu-item');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = typeof event !== 'undefined' && event?.target ? event.target : null;
    if (activeButton) activeButton.classList.add('active');

    items.forEach(item => {
        const match = category === 'all' || item.dataset.category === category;
        item.style.display = match ? 'block' : 'none';
    });
}

// -------------------------------------
// Global listeners
// -------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadCounterOrders();

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll('.menu-item').forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();
            item.style.display = (title.includes(searchTerm) || description.includes(searchTerm)) ? 'block' : 'none';
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const navButtons = document.querySelectorAll('#navMenu button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const navMenu = document.getElementById('navMenu');
            const hamburger = document.querySelector('.hamburger');
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    document.addEventListener('click', e => {
        const navMenu = document.getElementById('navMenu');
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('nav');
        if (
            navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target) &&
            !nav.contains(e.target)
        ) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) closeOrderModal();
};

// Cart button scroll behavior
const cartBtn = document.getElementById('cartButton');
window.addEventListener('scroll', () => {
    cartBtn.style.bottom = window.scrollY > 200 ? '40px' : '20px';
});

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}
