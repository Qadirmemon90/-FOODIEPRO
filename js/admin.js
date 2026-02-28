import { db } from './config.js';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- STATE MANAGEMENT ---
let currentVendor = {
    name: localStorage.getItem('vName') || "My Store",
    location: localStorage.getItem('vLoc') || "Street 123",
    image: localStorage.getItem('vImg') || "https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?auto=format&fit=crop&w=200"
};

// Sync UI with Profile
document.getElementById('store-name').value = currentVendor.name;
document.getElementById('store-location').value = currentVendor.location;
document.getElementById('profile-preview').src = currentVendor.image;
document.getElementById('display-store-name').innerText = currentVendor.name;

// --- SPA NAVIGATION ---
window.showSection = (sectionId) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase().includes(sectionId)) btn.classList.add('active');
    });
    if(sectionId === 'dashboard') initChart();
};

// --- MODAL CONTROLS ---
window.openAddModal = () => document.getElementById('add-product-modal').classList.remove('hidden');
window.closeAddModal = () => document.getElementById('add-product-modal').classList.add('hidden');
window.openEditModal = (id, name, price, cat, img) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-cat').value = cat;
    document.getElementById('edit-img').value = img;
    document.getElementById('edit-product-modal').classList.remove('hidden');
};
window.closeEditModal = () => document.getElementById('edit-product-modal').classList.add('hidden');

// --- THEME TOGGLE ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
    initChart();
});

// --- PROFILE LOGIC ---
window.saveVendorProfile = () => {
    currentVendor.name = document.getElementById('store-name').value;
    currentVendor.location = document.getElementById('store-location').value;
    localStorage.setItem('vName', currentVendor.name);
    localStorage.setItem('vLoc', currentVendor.location);
    document.getElementById('display-store-name').innerText = currentVendor.name;
    alert("Profile Updated!");
};

// --- PRODUCTS LOGIC ---
const productList = document.getElementById('admin-product-list');
onSnapshot(collection(db, "products"), (snapshot) => {
    productList.innerHTML = "";
    document.getElementById('total-prods').innerText = snapshot.size;
    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        productList.innerHTML += `
            <div class="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border dark:border-slate-800 group shadow-sm hover:shadow-xl transition">
                <img src="${p.image}" class="w-full h-44 object-cover rounded-3xl mb-4 group-hover:scale-105 transition">
                <h4 class="font-black dark:text-white px-2 truncate">${p.name}</h4>
                <div class="flex justify-between items-center px-2 mb-4">
                    <span class="text-orange-500 font-bold">Rs. ${p.price}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold">${p.vendorName || 'N/A'}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="openEditModal('${id}', '${p.name}', ${p.price}, '${p.category}', '${p.image}')" class="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white py-3 rounded-2xl text-xs font-bold hover:bg-blue-600 hover:text-white transition">Edit</button>
                    <button onclick="deleteDoc(doc(db, 'products', '${id}'))" class="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white py-3 rounded-2xl text-xs font-bold hover:bg-red-500 hover:text-white transition">Delete</button>
                </div>
            </div>
        `;
    });
});

window.updateProductData = async () => {
    const id = document.getElementById('edit-id').value;
    await updateDoc(doc(db, "products", id), {
        name: document.getElementById('edit-name').value,
        price: Number(document.getElementById('edit-price').value),
        category: document.getElementById('edit-cat').value,
        image: document.getElementById('edit-img').value
    });
    closeEditModal();
};

document.getElementById('save-prod-btn').addEventListener('click', async () => {
    const data = {
        name: document.getElementById('prod-name').value,
        price: Number(document.getElementById('prod-price').value),
        category: document.getElementById('prod-cat').value,
        image: document.getElementById('prod-img-url').value,
        vendorName: currentVendor.name,
        createdAt: serverTimestamp()
    };
    if(!data.name || !data.price) return alert("Fill all fields");
    await addDoc(collection(db, "products"), data);
    closeAddModal();
});

// --- ORDERS LOGIC ---
let orderFilter = "All";
window.filterOrders = (status) => {
    orderFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.innerText === status));
    renderOrders();
};

const renderOrders = () => {
    onSnapshot(query(collection(db, "orders"), orderBy("orderAt", "desc")), (snapshot) => {
        const orderContainer = document.getElementById('admin-order-list');
        orderContainer.innerHTML = "";
        let revenue = 0;
        snapshot.forEach(docSnap => {
            const o = docSnap.data();
            const id = docSnap.id;
            if(o.status === "Delivered") revenue += o.totalPrice;
            if(orderFilter !== "All" && o.status !== orderFilter) return;

            orderContainer.innerHTML += `
                <div class="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <div class="h-12 w-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-black">#${id.slice(-3)}</div>
                        <div>
                            <h4 class="font-extrabold dark:text-white">${o.customerName || 'Guest'}</h4>
                            <p class="text-[10px] text-gray-400 font-black uppercase">${o.vendorName || 'Store'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6 w-full md:w-auto justify-between">
                        <select onchange="updateOrderStatus('${id}', this.value)" class="bg-gray-100 dark:bg-slate-800 text-[10px] font-bold p-3 rounded-xl dark:text-white border-none outline-none">
                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Serving" ${o.status === 'Serving' ? 'selected' : ''}>Serving</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                        <span class="font-black text-xl dark:text-white">Rs. ${o.totalPrice}</span>
                    </div>
                </div>
            `;
        });
        document.getElementById('total-sales').innerText = `Rs. ${revenue}`;
        document.getElementById('total-orders').innerText = snapshot.size;
    });
};
window.updateOrderStatus = async (id, status) => await updateDoc(doc(db, "orders", id), { status });
renderOrders();

// --- CHART ---
let chart;
const initChart = () => {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['M','T','W','T','F','S','S'],
            datasets: [{ data:[30, 50, 40, 70, 90, 100, 120], borderColor: '#f97316', tension: 0.4, fill: true, backgroundColor: 'rgba(249, 115, 22, 0.05)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
};
initChart();