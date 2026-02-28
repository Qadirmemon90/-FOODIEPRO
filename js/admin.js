import { db } from './config.js';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. Order Status Update ---
// Window object par attach kiya taake HTML inline onclick kaam kare
window.markAsDelivered = async (orderId) => {
    const orderRef = doc(db, "orders", orderId);
    try {
        await updateDoc(orderRef, { status: "Delivered" });
        alert("Order Marked as Delivered! ✅");
    } catch (e) {
        alert("Error updating status");
    }
};

// --- 2. Live Orders List ---
const ordersList = document.getElementById('admin-order-list');
onSnapshot(query(collection(db, "orders"), orderBy("orderAt", "desc")), (snapshot) => {
    ordersList.innerHTML = "";
    if (snapshot.empty) {
        ordersList.innerHTML = `<div class="p-10 text-center text-gray-400 bg-white rounded-3xl">No orders found yet.</div>`;
    }
    snapshot.forEach(docSnap => {
        const order = docSnap.data();
        const id = docSnap.id;
        const isDelivered = order.status === "Delivered";

        ordersList.innerHTML += `
            <div class="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                <div class="flex items-center gap-4">
                    <div class="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                        #${id.slice(-3)}
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">Customer Order</h4>
                        <p class="text-gray-500 text-sm">${order.items?.length || 0} Items • <span class="text-orange-600 font-bold">Rs. ${order.totalPrice}</span></p>
                    </div>
                </div>
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <span class="px-4 py-1.5 ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} rounded-full text-xs font-bold uppercase tracking-widest">
                        ${order.status}
                    </span>
                    ${!isDelivered ? `
                        <button onclick="markAsDelivered('${id}')" class="flex-1 md:flex-none bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-500 transition-all">
                            Mark Delivered
                        </button>
                    ` : '<span class="text-green-500 font-bold">Completed ✅</span>'}
                </div>
            </div>
        `;
    });
});

// --- 3. Product Upload (Alternative URL Method) ---
const uploadBtn = document.getElementById('save-prod-btn');
uploadBtn.addEventListener('click', async () => {
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const category = document.getElementById('prod-cat').value;
    const imgUrl = document.getElementById('prod-img-url').value;

    if (!name || !price || !imgUrl) return alert("Please fill Name, Price, and Image URL!");

    try {
        uploadBtn.innerText = "Saving...";
        uploadBtn.disabled = true;

        // Example in admin.js
        await addDoc(collection(db, "products"), {
            name: name,
            price: Number(price),
            image: imgUrl, // Yeh naam 'image' hi hona chahiye
            createdAt: serverTimestamp()
        });

        alert("Product Added Successfully! 🍔");

        // Reset Inputs
        document.getElementById('prod-name').value = "";
        document.getElementById('prod-price').value = "";
        document.getElementById('prod-img-url').value = "";
        uploadBtn.innerText = "🚀 Publish Product";
        uploadBtn.disabled = false;
    } catch (e) {
        console.error(e);
        uploadBtn.disabled = false;
        uploadBtn.innerText = "🚀 Publish Product";
    }
});

// --- 4. Analytics & Stats ---
onSnapshot(collection(db, "orders"), (snapshot) => {
    let totalSales = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "Delivered") {
            totalSales += data.totalPrice || 0;
        }
    });
    document.getElementById('total-sales').innerText = `Rs. ${totalSales}`;
    document.getElementById('total-orders').innerText = snapshot.size;
});

onSnapshot(collection(db, "products"), (snapshot) => {
    document.getElementById('total-prods').innerText = snapshot.size;
});

// --- 5. Chart Visualization ---
const ctx = document.getElementById('salesChart')?.getContext('2d');
if (ctx) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Orders Velocity',
                data: [10, 25, 15, 40, 30, 55, 70],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
        }
    });
}