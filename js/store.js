import { db, auth } from './config.js';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let cart = [];

// --- 1. AUTH STATE CHECK (User Name Display + Dark Mode Support) ---
onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    
    if (user) {
        // Firestore se user ka naam lana
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userName = userDoc.exists() ? userDoc.data().name : "User";
        
        authSection.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-xl transition-colors">
                    Hi, ${userName.split(' ')[0]} 👋
                </span>
                <button id="logout-btn" class="text-xs font-bold text-red-500 hover:underline">Logout</button>
            </div>
        `;

        document.getElementById('logout-btn').addEventListener('click', () => {
            signOut(auth).then(() => location.reload());
        });
    } else {
        authSection.innerHTML = `
            <a href="login.html" class="bg-gray-900 dark:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm shadow-lg shadow-gray-200 dark:shadow-none">
                Login / Signup
            </a>
        `;
    }
});

// ... baaki imports wahi rahenge ...

let allProducts = []; // Saare products store karne ke liye

function fetchProducts() {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        allProducts = []; 
        const categories = new Set(); // Unique categories store karne ke liye

        snapshot.forEach((docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() };
            allProducts.push(data);
            if (data.category) categories.add(data.category);
        });

        renderCategories(Array.from(categories));
        renderProducts(allProducts);
    });
}

// --- Category Buttons Render Karna ---
function renderCategories(categories) {
    const filterContainer = document.getElementById('category-filters');
    // Pehla 'All' button barkrar rakhein
    filterContainer.innerHTML = `
        <button onclick="filterProducts('all')" class="cat-btn active-cat px-6 py-2 rounded-xl font-bold transition-all border dark:border-slate-700">
            All
        </button>
    `;

    categories.forEach(cat => {
        filterContainer.innerHTML += `
            <button onclick="filterProducts('${cat}')" class="cat-btn px-6 py-2 rounded-xl font-bold transition-all border dark:border-slate-700 hover:border-orange-500">
                ${cat}
            </button>
        `;
    });
}

// --- Products Ko Screen Par Dikhana ---
function renderProducts(productsToDisplay) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = "";

    if (productsToDisplay.length === 0) {
        productList.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10">Is category mein koi product nahi hai.</p>`;
        return;
    }

    productsToDisplay.forEach((prod) => {
        productList.innerHTML += `
            <div class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-5 shadow-sm border border-gray-100 dark:border-slate-700 card-hover transition-all duration-300 group">
                <div class="relative mb-5 overflow-hidden rounded-[2rem] bg-gray-200 dark:bg-slate-900" style="height: 200px;">
                    <img src="${prod.image}" alt="${prod.name}" 
                         onerror="this.src='https://placehold.co/600x400?text=Food'"
                         class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase text-orange-600 shadow-sm">
                        ${prod.category || 'Food'}
                    </div>
                </div>
                <h4 class="text-xl font-extrabold text-gray-900 dark:text-white mb-1">${prod.name}</h4>
                <div class="flex justify-between items-center mt-4">
                    <span class="text-2xl font-black text-gray-900 dark:text-white">Rs. ${prod.price}</span>
                    <button onclick="addToCart('${prod.id}', '${prod.name}', ${prod.price}, '${prod.image}')" 
                            class="bg-gray-900 dark:bg-orange-500 text-white p-3 rounded-2xl hover:bg-orange-500 transition-colors shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
}

// --- Filtering Logic ---
window.filterProducts = (category) => {
    // Buttons ka color change karna
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-cat');
        if(btn.innerText.toLowerCase() === category.toLowerCase()) btn.classList.add('active-cat');
    });

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
};

fetchProducts();
// ... baaki cart aur checkout ka logic wahi rahega ...

// --- 3. CART LOGIC (Dark Mode Ready Items) ---
window.addToCart = (id, name, price, image) => {
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id, name, price, image, quantity: 1 });
    updateCartUI();
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
};

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    container.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        container.innerHTML += `
            <div class="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-gray-900 dark:text-white">${item.name}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Rs. ${item.price} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600 font-bold text-xs">Remove</button>
            </div>
        `;
    });

    countEl.innerText = cart.length;
    totalEl.innerText = `Rs. ${total}`;
}

// --- 4. CHECKOUT ---
document.getElementById('checkout-btn').addEventListener('click', async () => {
    if (cart.length === 0) return alert("Your basket is empty!");
    const user = auth.currentUser;
    if (!user) return alert("Please Login to place an order!");

    try {
        await addDoc(collection(db, "orders"), {
            userId: user.uid,
            customerName: user.displayName || "Customer",
            items: cart,
            totalPrice: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
            status: "Pending",
            orderAt: serverTimestamp()
        });
        alert("🎉 Order placed successfully!");
        cart = [];
        updateCartUI();
        document.getElementById('cart-sidebar').classList.add('hidden');
    } catch (e) { alert("Error placing order."); }
});

// Sidebar Toggles
document.getElementById('cart-open').onclick = () => document.getElementById('cart-sidebar').classList.remove('hidden');
document.getElementById('cart-close').onclick = () => document.getElementById('cart-sidebar').classList.add('hidden');
document.getElementById('cart-close-overlay').onclick = () => document.getElementById('cart-sidebar').classList.add('hidden');