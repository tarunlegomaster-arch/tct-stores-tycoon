document.addEventListener("DOMContentLoaded", () => {
    let currentRole = ""; 
    let playerMoney = 100;
    let storeStock = 50;
    const maxStock = 50;
    let itemsInCart = 0;
    let progressStage = "shopping"; 
    let employeeQueue = [];

    const roleOverlay = document.getElementById('role-overlay');
    const roleBadge = document.getElementById('role-badge');
    const cashVal = document.getElementById('cash-val');
    const stockVal = document.getElementById('stock-val');
    const screenStatus = document.getElementById('screen-status');
    const pinLed = document.getElementById('pin-led');
    const queueLane = document.getElementById('queue-lane');
    const logText = document.getElementById('log-text');
    const warehouseBtn = document.getElementById('warehouse-btn');
    
    const employeeBtn = document.getElementById('btn-choose-employee');
    const customerBtn = document.getElementById('btn-choose-customer');
    const hpScreen = document.getElementById('hp-screen');
    const pinPad = document.getElementById('pin-pad');
    const aisleElements = document.querySelectorAll('.aisle-lane');

    employeeBtn.addEventListener('click', () => chooseRole('employee'));
    customerBtn.addEventListener('click', () => chooseRole('customer'));
    warehouseBtn.addEventListener('click', triggerRestock);
    hpScreen.addEventListener('click', interactRegister);
    pinPad.addEventListener('click', interactPinPad);
    
    aisleElements.forEach(aisle => {
        aisle.addEventListener('click', () => {
            const aisleNum = aisle.getAttribute('data-aisle');
            interactAisle(aisleNum);
        });
    });

    function chooseRole(role) {
        currentRole = role;
        roleOverlay.style.display = "none";
        roleBadge.textContent = role;
        roleBadge.className = `badge ${role}`;

        if (role === 'employee') {
            playerMoney = 0; 
            warehouseBtn.textContent = "📦 Order Inventory Delivery (-$20)";
            screenStatus.textContent = "WAITING";
            logText.textContent = "▶️ Signed in as an Employee. Customers will arrive shortly. Keep shelves loaded!";
            setInterval(spawnCustomerForEmployee, 4000);
        } else {
            playerMoney = 100; 
            warehouseBtn.textContent = "🔒 Storage Locked (Staff Only)";
            screenStatus.textContent = "CLOSED";
            logText.textContent = "▶️ Swiped Customer Card. Click on the 12 aisle shelves to add items into your basket!";
            updateCustomerView();
        }
        updateUI();
    }

    function interactAisle(aisleNumber) {
        if (!currentRole) return;

        if (currentRole === 'customer') {
            if (progressStage !== 'shopping') {
                logText.textContent = "▶️ You have already finished picking items! Head to the checkout counter area.";
                return;
            }
            if (storeStock <= 0) {
                logText.textContent = "▶️ Out of stock! The store shelves are empty. Wait for staff to refill them.";
                return;
            }
            
            itemsInCart++;
            storeStock--;
            logText.textContent = `▶️ Placed item from Shelves into basket. Cart: ${itemsInCart} items. Click register to check out when ready!`;
            screenStatus.textContent = "TAP TO GO";
            updateUI();
        } else {
            logText.textContent = `▶️ Checked Aisle Section ${aisleNumber}. Stock level: ${storeStock}/${maxStock}.`;
        }
    }

    function interactRegister() {
        if (currentRole === 'employee') {
            if (employeeQueue.length === 0) {
                logText.textContent = "▶️ Register terminal clear. No customers waiting to scan items.";
                return;
            }
            
            const shopper = employeeQueue.shift();
            playerMoney += 20; 
            logText.textContent = `▶️ Scanned items for ${shopper}. Register payout logged: +$20 wages.`;
            window.confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
            
            renderEmployeeQueue();
            if (employeeQueue.length > 0) {
                screenStatus.textContent = "SCAN NEXT";
            } else {
                screenStatus.textContent = "READY";
            }
            updateUI();
        } else {
            if (progressStage === 'shopping') {
                if (itemsInCart === 0) {
                    logText.textContent = "▶️ Your shopping basket is empty! Browse some shelves first.";
                    return;
                }
                progressStage = "paying";
                screenStatus.textContent = "TOTAL: $" + (itemsInCart * 10);
                pinLed.textContent = "INSERT CARD";
                logText.textContent = `▶️ Cashier scanned your cart total: $${itemsInCart * 10}. Click the orange PIN pad module to pay!`;
            }
        }
    }

    function interactPinPad() {
        if (currentRole !== 'customer') {
            logText.textContent = "▶️ Staff operations warning: Only customers can enter payment parameters on the PIN Pad device.";
            return;
        }
        
        if (progressStage === 'paying') {
            const grandTotal = itemsInCart * 10;
            if (playerMoney < grandTotal) {
                logText.textContent = "▶️ Declined! You don't have enough money inside your wallet to buy these items.";
                return;
            }
            
            playerMoney -= grandTotal;
            pinLed.textContent = "APPROVED";
            screenStatus.textContent = "PAID";
            logText.textContent = `▶️ Transaction approved! You bought your long-weekend items. Refresh page to swap roles!`;
            progressStage = "done";
            
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            itemsInCart = 0;
            updateUI();
        }
    }

    function spawnCustomerForEmployee() {
        if (employeeQueue.length >= 4) return;
        const targets = ["Mom 🛒", "Dad 🚙", "Shopper 📦"];
        const guest = targets[Math.floor(Math.random() * targets.length)];
        employeeQueue.push(guest);
        renderEmployeeQueue();
        
        screenStatus.textContent = "SCAN ITEM";
        screenStatus.style.color = "#f59e0b";
    }

    function renderEmployeeQueue() {
        queueLane.innerHTML = "";
        employeeQueue.forEach((customer, index) => {
            const element = document.createElement('div');
            element.className = 'queue-token';
            if (index === 0) element.style.background = "#10b981";
            element.innerHTML = `<span>👤</span> ${customer}`;
            queueLane.appendChild(element);
        });
    }

    function triggerRestock() {
        if (currentRole !== 'employee') return;
        
        if (playerMoney < 20) {
            logText.textContent = "▶️ Cannot purchase delivery! You need $20 from wages to buy inventory boxes.";
            return;
        }
        
        playerMoney -= 20;
        storeStock = maxStock;
        logText.textContent = "▶️ Backroom supply unboxed. All 12 shopping aisles refilled back to full capacity.";
        updateUI();
    }

    function updateCustomerView() {
        queueLane.innerHTML = `
            <div class="queue-token" style="background:#6366f1">🎒 Items in Basket: <strong id="basket-count" style="margin-left:5px">0</strong></div>
        `;
    }

    function updateUI() {
        cashVal.textContent = `$${playerMoney}`;
        stockVal.textContent = `${storeStock}/${maxStock}`;
        if (currentRole === 'customer') {
            const basketCount = document.getElementById('basket-count');
            if (basketCount) basketCount.textContent = itemsInCart;
        }
    }

    updateUI();
});
