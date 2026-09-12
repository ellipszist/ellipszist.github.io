// ================= Configuration =================
const Toast = Swal.mixin({
    toast: true, position: 'top', showConfirmButton: false, timer: 1500,
    background: '#334155', color: '#fff'
});

// ================= State Management =================
let db = {
    items: JSON.parse(localStorage.getItem('v5_items')) || [],
    techs: JSON.parse(localStorage.getItem('v5_techs')) || [],
    pending: JSON.parse(localStorage.getItem('v5_pending')) || [],
    history: JSON.parse(localStorage.getItem('v5_history')) || []
};

let chartInstance = null;
let html5QrcodeScanner = null;
let autoScanTechId = null;
let currentHistoryFilter = 'all';

function saveData() {
    localStorage.setItem('v5_items', JSON.stringify(db.items));
    localStorage.setItem('v5_techs', JSON.stringify(db.techs));
    localStorage.setItem('v5_pending', JSON.stringify(db.pending));
    localStorage.setItem('v5_history', JSON.stringify(db.history));
    updateUI();
}

// ================= Helpers =================
function getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    if (name.includes('ไฟฟ้า')) return '<i class="fa-solid fa-plug-circle-bolt text-amber-500"></i>';
    if (name.includes('ช่าง') || name.includes('เครื่องมือ')) return '<i class="fa-solid fa-wrench text-indigo-500"></i>';
    if (name.includes('สิ้นเปลือง')) return '<i class="fa-solid fa-box-open text-emerald-500"></i>';
    if (name.includes('อะไหล่') || name.includes('เฟือง')) return '<i class="fa-solid fa-gear text-slate-500"></i>';
    if (name.includes('ปลอดภัย') || name.includes('safety')) return '<i class="fa-solid fa-hard-hat text-yellow-500"></i>';
    return '<i class="fa-solid fa-tag text-slate-400"></i>'; 
}

function generateRandomColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.floor(Math.random() * 360);
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

// ================= Navigation =================
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

// ================= UI Renderers =================
function updateUI() {
    renderDashboard(); 
    renderItems(); 
    renderPending(); 
    renderHistory(); 
    renderTechs();
}

function renderDashboard() {
    const lowStockItems = db.items.filter(i => i.stock <= i.minStock);
    
    document.getElementById('statTotalItems').innerText = db.items.length;
    document.getElementById('statPending').innerText = db.pending.length;
    
    const badge = document.getElementById('pendingBadge');
    badge.innerText = db.pending.length;
    badge.style.display = db.pending.length > 0 ? 'flex' : 'none';

    const tbody = document.getElementById('lowStockBody');
    if (lowStockItems.length === 0) {
        tbody.innerHTML = `<p class="text-sm text-slate-400 text-center py-2">สต็อกปกติ</p>`;
    } else {
        tbody.innerHTML = lowStockItems.map(i => `
            <div class="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm mb-2">
                <span class="font-bold text-slate-700">${i.name}</span>
                <span class="bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-bold">${i.stock} ${i.unit}</span>
            </div>
        `).join('');
    }

    const ctx = document.getElementById('stockChart').getContext('2d');
    if(chartInstance) chartInstance.destroy();
    
    const baseColors = generateRandomColors(db.items.length);
    const backgroundColors = db.items.map((i, index) => 
        i.stock <= i.minStock ? '#f43f5e' : baseColors[index]
    );

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: db.items.map(i => i.name),
            datasets: [{
                label: 'จำนวนคงเหลือ',
                data: db.items.map(i => i.stock),
                backgroundColor: backgroundColors,
                borderRadius: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return `หมวดหมู่: ${db.items[context.dataIndex].category}`;
                        }
                    }
                }
            }, 
            scales: { 
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } }, 
                x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } } 
            } 
        }
    });
}

function renderItems() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('itemTableBody');
    const filtered = db.items.filter(i => (i.name.toLowerCase().includes(keyword) || i.id.toLowerCase().includes(keyword) || i.category.toLowerCase().includes(keyword)));
    
    if (filtered.length === 0) { container.innerHTML = `<div class="text-center text-slate-400 py-10">ไม่พบอุปกรณ์</div>`; return; }

    container.innerHTML = filtered.map(i => {
        const isLow = i.stock <= i.minStock;
        const badgeColor = isLow ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700';
        const catIcon = getCategoryIcon(i.category); 
        
        return `
        <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 relative overflow-hidden active:scale-[0.98] transition-transform">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold text-slate-800 text-base">${i.name}</h3>
                    <p class="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1.5 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        ${catIcon} ${i.category}
                    </p>
                    <div class="mt-2 text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span>ID: ${i.id}</span>
                        <button onclick="showBarcode('${i.id}', '${i.name}')" class="text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded text-[10px] hover:bg-indigo-100">
                            <i class="fa-solid fa-barcode"></i> Code 128
                        </button>
                    </div>
                </div>
                <div class="${badgeColor} px-3 py-1.5 rounded-xl font-bold text-sm flex-shrink-0">${i.stock} <span class="text-[10px] font-normal">${i.unit}</span></div>
            </div>
            <div class="flex justify-between items-center border-t border-slate-50 pt-3">
                <button onclick="editItem('${i.id}')" class="text-slate-400 hover:text-indigo-600 p-2"><i class="fa-solid fa-pen"></i></button>
                <button onclick="handleWithdraw('${i.id}')" class="bg-indigo-600 text-white w-full max-w-[140px] py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                    <i class="fa-solid fa-hand-holding-hand"></i> ทำรายการ
                </button>
            </div>
        </div>
    `}).join('');
}

function showBarcode(id, name) {
    Swal.fire({
        title: name,
        html: `
            <div class="flex justify-center items-center py-4">
                <svg id="barcode-svg"></svg>
            </div>
            <p class="text-xs text-slate-400">Barcode 128 - นำรูปไปพิมพ์เพื่อใช้งาน</p>
        `,
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#4f46e5',
        didOpen: () => {
            JsBarcode("#barcode-svg", id, {
                format: "CODE128", lineColor: "#1e293b", width: 2, height: 60, displayValue: true, fontSize: 14, font: "Prompt"
            });
        }
    });
}

function renderPending() {
    const container = document.getElementById('pendingTableBody');
    if(db.pending.length === 0) { container.innerHTML = `<div class="text-center text-slate-400 py-10">ไม่มีรายการค้างคืน</div>`; return; }
    container.innerHTML = db.pending.map(p => `
        <div class="bg-white p-4 rounded-3xl shadow-sm border border-amber-100 border-l-4 border-l-amber-400 flex flex-col mb-3">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="text-[10px] text-slate-400 mb-1">${p.date}</p>
                    <h3 class="font-bold text-slate-800 text-base">${p.itemName}</h3>
                    <p class="text-xs text-slate-600 mt-1"><i class="fa-solid fa-user-tag text-slate-300 mr-1"></i> ${p.techName}</p>
                </div>
                <div class="flex flex-col items-end">
                    <span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-xl font-bold text-sm mb-2">${p.quantity}</span>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-3 pt-3 border-t border-amber-50">
                <button onclick="handleLost('${p.id}')" class="bg-rose-50 text-rose-500 hover:bg-rose-100 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"><i class="fa-solid fa-triangle-exclamation"></i> ชำรุด/สูญหาย</button>
                <button onclick="handleReturn('${p.id}')" class="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"><i class="fa-solid fa-arrow-turn-down fa-rotate-90"></i> รับคืน</button>
            </div>
        </div>
    `).join('');
}

window.filterHistory = function(type, btnElement) {
    currentHistoryFilter = type;
    document.querySelectorAll('.hist-filter-btn').forEach(btn => {
        btn.className = "hist-filter-btn flex-shrink-0 bg-white text-slate-500 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition";
    });
    if (btnElement) {
        btnElement.className = "hist-filter-btn active flex-shrink-0 bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition";
        btnElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('historyTableBody');
    if(db.history.length === 0){ container.innerHTML = `<div class="text-center text-slate-400 py-4">ยังไม่มีประวัติ</div>`; return;}
    
    let sorted = [...db.history].reverse();
    
    if (currentHistoryFilter !== 'all') {
        if (currentHistoryFilter === 'System') {
            sorted = sorted.filter(h => h.techName === 'System');
        } else {
            sorted = sorted.filter(h => h.action === currentHistoryFilter);
        }
    }
    
    sorted = sorted.slice(0, 50);

    if(sorted.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 py-10">ไม่มีประวัติประเภทนี้</div>`;
        return;
    }

    container.innerHTML = sorted.map(h => {
        let color = 'text-indigo-400';
        let icon = 'fa-bolt';
        
        if (h.action === 'ยืม') { color = 'text-amber-500'; icon = 'fa-hand-holding-hand'; }
        else if (h.action === 'เบิกขาด') { color = 'text-slate-400'; icon = 'fa-box-open'; }
        else if (h.action === 'คืน') { color = 'text-emerald-500'; icon = 'fa-boxes-packing'; }
        else if (h.action === 'สูญหาย') { color = 'text-rose-500'; icon = 'fa-triangle-exclamation'; }

        return `
        <div class="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
            <div class="${color} bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"><i class="fa-solid ${icon}"></i></div>
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <p class="font-bold text-slate-800 text-sm">${h.itemName}</p>
                    <p class="font-bold text-slate-800 text-sm">${h.quantity > 0 ? h.quantity : ''}</p>
                </div>
                <div class="flex justify-between items-end mt-0.5">
                    <p class="text-[10px] text-slate-500">${h.techName} &bull; ${h.date}</p>
                    <span class="text-[9px] font-bold ${color} bg-white px-1.5 rounded">${h.action}</span>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderTechs() {
    const container = document.getElementById('techTableBody');
    if(db.techs.length===0) { container.innerHTML = ''; return; }
    container.innerHTML = db.techs.map(t => `
        <div class="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
            <div>
                <p class="font-bold text-slate-700 text-sm">${t.name}</p>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-[10px] text-indigo-500 font-mono">${t.id}</p>
                    <button onclick="showBarcode('${t.id}', '${t.name}')" class="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]"><i class="fa-solid fa-barcode"></i> Code</button>
                </div>
            </div>
            <button onclick="deleteTech('${t.id}')" class="text-rose-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join('');
}

// ================= Core Actions & Modals =================
function logTransaction(action, techName, itemName, quantity) {
    db.history.push({ date: new Date().toLocaleString('th-TH').slice(0, 16), action, techName, itemName, quantity });
    if (db.history.length > 200) db.history.shift();
}

window.insertTag = function(id, val) { document.getElementById(id).value = val; }
window.adjustQty = function(amt) {
    const el = document.getElementById('w-qty');
    let val = parseInt(el.value) || 0;
    const max = parseInt(el.getAttribute('max'));
    val += amt; if (val < 1) val = 1; if (val > max) val = max;
    el.value = val;
}

async function openAddItemModal() {
    const inCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mt-1 text-[16px] outline-none focus:border-indigo-500";
    const tagCls = "inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600 border border-slate-200 cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors";

    const { value: formValues } = await Swal.fire({
        title: 'เพิ่มอุปกรณ์ใหม่', width: '90%', padding: '1rem',
        html: `
            <div class="text-left">
                <input id="swal-name" class="${inCls}" placeholder="ชื่ออุปกรณ์ *">
                <input id="swal-cat" class="${inCls} mt-3 mb-2" placeholder="หมวดหมู่ (พิมพ์หรือเลือกด้านล่าง)">
                <div class="mb-2 flex flex-wrap gap-2">
                    <span onclick="insertTag('swal-cat', 'เครื่องมือไฟฟ้า')" class="${tagCls}">เครื่องมือไฟฟ้า</span>
                    <span onclick="insertTag('swal-cat', 'เครื่องมือช่าง')" class="${tagCls}">เครื่องมือช่าง</span>
                    <span onclick="insertTag('swal-cat', 'วัสดุสิ้นเปลือง')" class="${tagCls}">วัสดุสิ้นเปลือง</span>
                    <span onclick="insertTag('swal-cat', 'อุปกรณ์ความปลอดภัย')" class="${tagCls}">อุปกรณ์ความปลอดภัย</span>
                    <span onclick="insertTag('swal-cat', 'อะไหล่')" class="${tagCls}">อะไหล่</span>
                </div>
                <div class="grid grid-cols-2 gap-3 mt-2 mb-2">
                    <div><label class="text-[10px] font-bold text-slate-500">จำนวนตั้งต้น</label><input id="swal-stock" type="number" class="${inCls}" value="0"></div>
                    <div><label class="text-[10px] font-bold text-slate-500">เตือนสต็อกต่ำ</label><input id="swal-min" type="number" class="${inCls}" value="5"></div>
                </div>
                <div><label class="text-[10px] font-bold text-slate-500">หน่วย</label><input id="swal-unit" class="${inCls}" value="ชิ้น"></div>
                <div class="mt-4"><label class="text-[10px] font-bold text-slate-500">Barcode (ไม่ใส่=สุ่มสร้างให้)</label><input id="swal-barcode" class="${inCls}"></div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#4f46e5',
        preConfirm: () => {
            const name = document.getElementById('swal-name').value;
            if(!name) { Swal.showValidationMessage('กรุณากรอกชื่อ'); return false;}
            return {
                name, cat: document.getElementById('swal-cat').value || 'ทั่วไป',
                stock: parseInt(document.getElementById('swal-stock').value) || 0,
                minStock: parseInt(document.getElementById('swal-min').value) || 0,
                unit: document.getElementById('swal-unit').value || 'ชิ้น',
                barcode: document.getElementById('swal-barcode').value || 'ID' + Math.floor(100000 + Math.random() * 900000)
            }
        }
    });

    if (formValues) {
        db.items.push({ id: formValues.barcode, name: formValues.name, category: formValues.cat, stock: formValues.stock, minStock: formValues.minStock, unit: formValues.unit });
        logTransaction('เพิ่มสินค้า', 'System', formValues.name, formValues.stock);
        saveData(); Toast.fire({ icon: 'success', title: 'บันทึกสำเร็จ' });
    }
}

async function handleWithdraw(itemId) {
    const item = db.items.find(i => i.id === itemId);
    if(db.techs.length === 0) return Swal.fire({icon: 'warning', title: 'เพิ่มชื่อช่างก่อน', confirmButtonColor: '#4f46e5', width: '80%'});
    if(item.stock <= 0) return Toast.fire({icon: 'error', title: 'สต็อกหมด!'});

    const techOptions = db.techs.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    const isConsumable = item.category.includes('สิ้นเปลือง') || item.category.includes('อะไหล่');
    const bCheck = isConsumable ? '' : 'checked', cCheck = isConsumable ? 'checked' : '';
    const inCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[16px] outline-none font-bold";

    const { value: result } = await Swal.fire({
        title: item.name, width: '95%', padding: '1rem',
        html: `
            <div class="text-left mt-2">
                <div class="bg-indigo-600 text-white rounded-2xl p-3 mb-4 text-center font-bold shadow-md">
                    คงเหลือ: <span class="text-2xl">${item.stock}</span> ${item.unit}
                </div>
                <select id="w-tech" class="${inCls} mb-4"><option value="">- เลือกช่าง -</option>${techOptions}</select>
                <div class="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-3xl border border-slate-200">
                    <button type="button" onclick="adjustQty(-1)" class="w-14 h-14 rounded-2xl bg-white shadow-sm text-slate-700 font-bold text-2xl active:scale-95">-</button>
                    <input id="w-qty" type="number" class="flex-1 bg-transparent text-center text-3xl font-bold m-0 border-0 outline-none" value="1" min="1" max="${item.stock}" readonly>
                    <button type="button" onclick="adjustQty(1)" class="w-14 h-14 rounded-2xl bg-indigo-500 shadow-sm text-white font-bold text-2xl active:scale-95">+</button>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-1">
                    <label class="border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-1 active:bg-slate-50">
                        <input type="radio" name="w-type" value="borrow" ${bCheck} class="w-4 h-4"> <span class="text-xs font-bold text-slate-700">ยืม (คืน)</span>
                    </label>
                    <label class="border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-1 active:bg-slate-50">
                        <input type="radio" name="w-type" value="consume" ${cCheck} class="w-4 h-4"> <span class="text-xs font-bold text-slate-500">เบิกขาด</span>
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#4f46e5',
        preConfirm: () => {
            const techId = document.getElementById('w-tech').value;
            const qty = parseInt(document.getElementById('w-qty').value);
            const type = document.querySelector('input[name="w-type"]:checked').value;
            if (!techId) { Swal.showValidationMessage('เลือกผู้ทำรายการ'); return false; }
            return { techId, qty, type };
        }
    });

    if (result) {
        const tech = db.techs.find(t => t.id === result.techId);
        item.stock -= result.qty;
        const actLabel = result.type === 'borrow' ? 'ยืม' : 'เบิกขาด';
        
        if (result.type === 'borrow') {
            db.pending.push({ id: 'P-' + Date.now(), itemId: item.id, itemName: item.name, techId: tech.id, techName: tech.name, quantity: result.qty, date: new Date().toLocaleString('th-TH').slice(0,16) });
        }
        logTransaction(actLabel, tech.name, item.name, result.qty); saveData(); Toast.fire({ icon: 'success', title: 'สำเร็จ' });
    }
}

async function editItem(id) {
    const item = db.items.find(i => i.id === id);
    const inCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mt-1 text-[16px] outline-none";
    const result = await Swal.fire({
        title: 'แก้ไขข้อมูล', width: '90%', padding: '1rem',
        html: `<div class="text-left text-sm font-bold text-slate-500">
            ชื่ออุปกรณ์ <input id="swal-name" class="${inCls} mb-3" value="${item.name}">
            <div class="grid grid-cols-2 gap-3">
                <div>สต็อกปัจจุบัน <input id="swal-stock" type="number" class="${inCls}" value="${item.stock}"></div>
                <div>เตือนสต็อกต่ำ <input id="swal-min" type="number" class="${inCls}" value="${item.minStock !== undefined ? item.minStock : 5}"></div>
            </div>
        </div>`,
        showCancelButton: true, showDenyButton: true, 
        confirmButtonText: 'บันทึก', denyButtonText: 'ลบ', cancelButtonText: 'ยกเลิก', 
        confirmButtonColor: '#4f46e5', denyButtonColor: '#f43f5e',
        preConfirm: () => {
            return { 
                name: document.getElementById('swal-name').value, 
                stock: parseInt(document.getElementById('swal-stock').value),
                minStock: parseInt(document.getElementById('swal-min').value)
            };
        }
    });

    if (result.isConfirmed && result.value) { 
        item.name = result.value.name; 
        item.stock = result.value.stock; 
        item.minStock = result.value.minStock;
        logTransaction('แก้ไข', 'System', item.name, item.stock); 
        saveData(); 
        Toast.fire({ icon: 'success', title: 'บันทึกแล้ว' });
    } 
    else if (result.isDenied) { 
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ "${item.name}" ออกจากระบบ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then((confirmResult) => {
            if (confirmResult.isConfirmed) {
                db.items = db.items.filter(i => i.id !== id); 
                logTransaction('ลบ', 'System', item.name, 0); 
                saveData(); 
                Toast.fire({ icon: 'success', title: 'ลบข้อมูลเรียบร้อย' });
            }
        });
    }
}

async function handleReturn(pendingId) {
    const p = db.pending.find(x => x.id === pendingId);
    const item = db.items.find(i => i.id === p.itemId);
    const { isConfirmed } = await Swal.fire({ title: 'รับคืนอุปกรณ์', html: `<b class="text-xl">${p.itemName}</b><br><span class="text-slate-500">คืนจากคุณ ${p.techName}</span>`, icon: 'question', showCancelButton: true, confirmButtonText: 'รับคืน', confirmButtonColor: '#10b981', width: '85%' });
    if (isConfirmed) { if(item) item.stock += p.quantity; db.pending = db.pending.filter(x => x.id !== pendingId); logTransaction('คืน', p.techName, p.itemName, p.quantity); saveData(); Toast.fire({ icon: 'success', title: 'รับของแล้ว' }); }
}

async function handleLost(pendingId) {
    const p = db.pending.find(x => x.id === pendingId);
    const { isConfirmed } = await Swal.fire({ 
        title: 'ยืนยันสูญหาย/ชำรุด', 
        html: `<p class="text-rose-500 text-sm mb-2">อุปกรณ์นี้จะไม่ถูกนำกลับเข้าสต็อก</p><b class="text-xl">${p.itemName}</b><br><span class="text-slate-500">ยืมโดยคุณ ${p.techName}</span>`, 
        icon: 'warning', showCancelButton: true, confirmButtonText: 'ยืนยัน', confirmButtonColor: '#f43f5e', cancelButtonText: 'ยกเลิก', width: '85%' 
    });
    if (isConfirmed) { 
        db.pending = db.pending.filter(x => x.id !== pendingId); 
        logTransaction('สูญหาย', p.techName, p.itemName, p.quantity); 
        saveData(); 
        Toast.fire({ icon: 'info', title: 'บันทึกสูญหายแล้ว' }); 
    }
}

// ================= User & Settings =================
document.getElementById('addTechForm').addEventListener('submit', (e) => {
    e.preventDefault(); const id = 'EMP'+Math.floor(1000 + Math.random() * 9000);
    db.techs.push({ id, name: document.getElementById('techName').value }); document.getElementById('addTechForm').reset(); saveData(); Toast.fire({ icon: 'success', title: `บันทึกแล้ว` });
});

function deleteTech(id) { db.techs = db.techs.filter(t => t.id !== id); saveData(); }
function exportData() { const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db)); const a = document.createElement('a'); a.href = d; a.download = "backup.json"; a.click(); }
function importData() { const f = document.getElementById('importFile').files[0]; if(!f) return; const r = new FileReader(); r.onload = (e) => { try { db = JSON.parse(e.target.result); saveData(); Toast.fire({icon: 'success', title: 'สำเร็จ'}); } catch(err){} }; r.readAsText(f); }
function clearAllData() { Swal.fire({ title: 'ล้างข้อมูล?', icon: 'error', showCancelButton: true, confirmButtonColor: '#f43f5e', confirmButtonText: 'ล้างข้อมูล', width: '80%' }).then((r) => { if (r.isConfirmed) { localStorage.clear(); location.reload(); } }); }

function printAllBarcodes() {
    if(db.items.length === 0 && db.techs.length === 0) return Swal.fire('ไม่มีข้อมูล', 'ไม่มีอุปกรณ์หรือรายชื่อช่างให้พิมพ์', 'info');

    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head>
            <title>พิมพ์บาร์โค้ด - Smart Inventory</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
            <style>
                body { font-family: sans-serif; text-align: center; }
                .barcode-container { display: inline-block; margin: 15px; padding: 10px; border: 1px dashed #ccc; border-radius: 8px;}
                .barcode-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; max-width: 200px; word-wrap: break-word; }
                h2 { margin-top: 30px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px; }
            </style>
        </head><body>
            <h2>บาร์โค้ดอุปกรณ์ (Items)</h2>
            <div id="items-barcodes"></div>
            <h2>บาร์โค้ดรายชื่อช่าง (Technicians)</h2>
            <div id="techs-barcodes"></div>
            <script>
                const items = ${JSON.stringify(db.items)};
                items.forEach((item, index) => {
                    const container = document.createElement('div');
                    container.className = 'barcode-container';
                    container.innerHTML = '<div class="barcode-title">' + item.name + '</div><svg id="item-barcode-' + index + '"></svg>';
                    document.getElementById('items-barcodes').appendChild(container);
                    JsBarcode("#item-barcode-" + index, item.id, { format: "CODE128", width: 2, height: 50, displayValue: true, fontSize: 14 });
                });

                const techs = ${JSON.stringify(db.techs)};
                techs.forEach((tech, index) => {
                    const container = document.createElement('div');
                    container.className = 'barcode-container';
                    container.innerHTML = '<div class="barcode-title">' + tech.name + '</div><svg id="tech-barcode-' + index + '"></svg>';
                    document.getElementById('techs-barcodes').appendChild(container);
                    JsBarcode("#tech-barcode-" + index, tech.id, { format: "CODE128", width: 2, height: 50, displayValue: true, fontSize: 14 });
                });

                setTimeout(() => { window.print(); }, 500);
            <\/script>
        </body></html>
    `);
    printWindow.document.close();
}

// ================= Scanner =================
function startAutoScanner() {
    autoScanTechId = null;
    document.getElementById('scannerModal').classList.remove('hidden');
    document.getElementById('activeUserBadge').classList.add('hidden');
    document.getElementById('scanStatus').innerText = "1. สแกนรหัสช่าง (ID)";
    document.getElementById('scanStatus').className = "bg-indigo-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg transform transition-all duration-300";
    
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: {width: 250, height: 250} }, 
        (txt) => { processScan(txt.trim()); }, (err) => {}
    ).catch(err => { Toast.fire({icon: 'error', title: 'เปิดกล้องไม่ได้ (HTTPS?)'}); stopScanner(); });
}

function stopScanner() { document.getElementById('scannerModal').classList.add('hidden'); if(html5QrcodeScanner) html5QrcodeScanner.stop().catch(e=>{}); }
function resetAutoScanner() { autoScanTechId = null; document.getElementById('activeUserBadge').classList.add('hidden'); document.getElementById('scanStatus').innerText = "1. สแกนรหัสช่าง (ID)"; document.getElementById('scanStatus').classList.replace('bg-emerald-500', 'bg-indigo-600'); }

let isScanning = false;
function processScan(code) {
    if (isScanning) return; isScanning = true; setTimeout(() => isScanning = false, 1500);

    const tech = db.techs.find(t => t.id === code);
    if (tech) {
        autoScanTechId = tech.id; 
        document.getElementById('activeUserName').innerText = tech.name; 
        document.getElementById('activeUserBadge').classList.remove('hidden');
        document.getElementById('scanStatus').innerText = "2. สแกนอุปกรณ์"; 
        document.getElementById('scanStatus').classList.replace('bg-indigo-600', 'bg-emerald-500');
        return Toast.fire({ icon: 'success', title: `สวัสดี ${tech.name}` });
    }

    const item = db.items.find(i => i.id === code);
    if (item) {
        if (!autoScanTechId) return Toast.fire({ icon: 'warning', title: 'สแกนช่างก่อน!' });
        if (item.stock < 1) return Toast.fire({ icon: 'error', title: 'สต็อกหมด!' });
        
        const tObj = db.techs.find(t => t.id === autoScanTechId);
        const isC = item.category.includes('สิ้นเปลือง') || item.category.includes('อะไหล่');
        item.stock -= 1;
        
        if (!isC) {
            db.pending.push({ id: 'P-' + Date.now(), itemId: item.id, itemName: item.name, techId: tObj.id, techName: tObj.name, quantity: 1, date: new Date().toLocaleString('th-TH').slice(0,16) });
        }
        
        logTransaction(isC ? 'เบิกขาด':'ยืม', tObj.name, item.name, 1); 
        saveData();
        return Toast.fire({ icon: 'success', title: `ทำรายการ 1 ${item.unit} สำเร็จ` });
    }
    Toast.fire({ icon: 'error', title: 'ไม่พบรหัส!' });
}

// ================= Initialization =================
updateUI();