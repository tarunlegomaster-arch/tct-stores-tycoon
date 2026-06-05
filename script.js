document.addEventListener("DOMContentLoaded", () => {
    let currentRole = ""; 
    let playerMoney = 100;
    let storeStock = 50;
    const maxStock = 50;
    let progressStage = "shopping"; 
    let employeeQueue = [];

    // Walmart Item Tracking States
    let customerBasket = [];
    let transactionTotal = 0;

    // Walmart Aisle Item Database Mappings
    const aisleItems = {
        "1": { name: "Fresh Apples & Bananas", price: 5 },
        "2": { name: "Premium Cookies & Ice Cream", price: 8 },
        "3": { name: "Laundry Detergent & Soap", price: 12 },
        "4": { name: "Lego Tycoon Building Set", price: 25 },
        "5": { name: "Comfy Long-Weekend Hoodie", price: 30 },
        "6": { name: "Flat Screen Smart TV", price: 75 }
    };

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
            warehouseBtn.textContent = "📦 Restock Backroom Shelves (-$20)";
            screenStatus.textContent = "WAITING";
            logText.textContent = "▶️ Signed in as an Employee. Keep front aisles supplied by unloading backroom storage shelves!";
            setInterval(spawnCustomerForEmployee, 4000);
        } else {
            playerMoney = 150; // Give the customer a bit more starting money for high-end items
            warehouseBtn.textContent = "🔒 Backroom Shelves Locked";
            screenStatus.textContent = "CLOSED";
            logText.textContent = "▶️ Customer shopping session active. Browse the 12 Walmart aisles to find items!";
            updateCustomerView();
        }
        updateUI();
    }

    function interactAisle(aisleNumber) {
        if (!currentRole) return;

        if (currentRole === 'customer') {
            if (progressStage !== 'shopping') {
                logText.textContent = "▶️ Basket finalized. Proceed to the front desktop register.";
                return;
            }
            if (storeStock <= 0) {
                logText.textContent = "▶️ Floor Aisle empty! Wait for an employee to bring items from backroom storage shelves.";
                return;
            }
            
            const itemSelected = aisleItems[aisleNumber];
            customerBasket.push(itemSelected);
            transactionTotal += itemSelected.price;
            storeStock--;
            
            logText.textContent = `▶️ Added [${itemSelected.name}] ($${itemSelected.price}) to cart. Total Items: ${customerBasket.length}.`;
            screenStatus.textContent = "TAP TO GO";
            updateUI();
        } else {
            const itemSelected = aisleItems[aisleNumber];
            logText.textContent = `▶️ Employee Stock Audit: Section selling [${itemSelected.name}] checked. Stock: ${storeStock}/${maxStock}.`;
        }
    }

    function interactRegister() {
        if (currentRole === 'employee') {
            if (employeeQueue.length === 0) {
                logText.textContent = "▶️ Front counter register clear. No customers waiting.";
                return;
            }
            
            const shopper = employeeQueue.shift();
            playerMoney += 25; 
            logText.textContent = `▶️ Scanned custom grocery items on HP terminal for ${shopper}. Wages payout: +$25 cash profit.`;
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
                if (customerBasket.length === 0) {
                    logText.textContent = "▶️ Your shopping basket is empty! Fill up in the floor aisles first.";
                    return;
                }
                progressStage = "paying";
                screenStatus.textContent = "TOTAL: $" + transactionTotal;
                pinLed.textContent = "INSERT CARD";
                logText.textContent = `▶️ Checkout complete! Your Walmart total is $${transactionTotal}. Tap the orange PIN Pad card reader to pay!`;
            }
        }
    }

    function interactPinPad() {
        if (currentRole !== 'customer') {
            logText.textContent = "▶️ Error: PIN Pad terminal restricted to shopping customers only.";
            return;
        }
        
        if (progressStage === 'paying') {
            if (playerMoney < transactionTotal) {
                logText.textContent = `▶️ Transaction Declined! Your total ($${transactionTotal}) exceeds your wallet balance. Refresh to retry.`;
                return;
            }
            
            playerMoney -= transactionTotal;
            pinLed.textContent = "APPROVED";
            screenStatus.textContent = "PAID";
            logText.textContent = `▶️ Payment processed! You successfully purchased ${customerBasket.length} Walmart items for the long weekend!`;
            progressStage = "done";
            
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            customerBasket = [];
            transactionTotal = 0;
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
            logText.textContent = "▶️ Order failed! You need $20 in register wages to unlock new supply boxes.";
            return;
        }
        
        playerMoney -= 20;
        storeStock = maxStock;
        logText.textContent = "▶️ Backroom storage shelves reloaded. Front aisles supplied.";
        updateUI();
    }

    function updateCustomerView() {
        queueLane.innerHTML = `
            <div class="queue-token" style="background:#6366f1">🎒 Items in Cart: <strong id="basket-count" style="margin-left:5px">0</strong></div>
        `;
    }

    function updateUI() {
        cashVal.textContent = `$${playerMoney}`;
        stockVal.textContent = `${storeStock}/${maxStock}`;
        if (currentRole === 'customer') {
            const basketCount = document.getElementById('basket-count');
            if (basketCount) basketCount.textContent = customerBasket.length;
        }
    }

    updateUI();
});
