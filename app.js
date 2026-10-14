const firebaseConfig = {
  apiKey: "AIzaSyA56JsL9tlH49whyidpDzPsiMc1KIN0z7o",
  authDomain: "siraq-3ff83.firebaseapp.com",
  projectId: "siraq-3ff83",
  storageBucket: "siraq-3ff83.firebasestorage.app",
  messagingSenderId: "665393178733",
  appId: "1:665393178733:web:1cb14d19ee8beb01d4b764",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "admin@siraq.com";
let currentUser = null;
let isAdmin = false;
let daftarProduk = [];
let semuaTransaksi = [];
let keranjang = [];
let isAuthModeLogin = true;

const isLoginPage = document.getElementById("auth-section") !== null;
const isDashboardPage = document.getElementById("dashboard-section") !== null;

// FUNGSI NAVIGASI TAB
function bukaTab(event, namaTab) {
  let menuItems = document.getElementsByClassName("menu-item");
  for (let i = 0; i < menuItems.length; i++) {
    menuItems[i].classList.remove("active");
  }

  let tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove("active");
  }

  document.getElementById(namaTab).classList.add("active");
  if (event) event.currentTarget.classList.add("active");
}

// AUTENTIKASI
auth.onAuthStateChanged((user) => {
  if (user) {
    if (isLoginPage) {
      window.location.href = "dashboard.html";
    } else if (isDashboardPage) {
      currentUser = user;
      isAdmin = user.email === ADMIN_EMAIL;
      setupDashboardUI();
    }
  } else {
    if (isDashboardPage) {
      window.location.href = "index.html";
    }
  }
});

function toggleAuthMode() {
  isAuthModeLogin = !isAuthModeLogin;
  if (isAuthModeLogin) {
    document.getElementById("auth-title").innerText = "Masuk ke Siraq";
    document.getElementById("auth-subtitle").innerText =
      "Silakan login untuk memesan";
    document.getElementById("login-buttons").style.display = "block";
    document.getElementById("register-buttons").style.display = "none";
  } else {
    document.getElementById("auth-title").innerText = "Daftar Akun Baru";
    document.getElementById("auth-subtitle").innerText =
      "Buat akun untuk mulai memesan";
    document.getElementById("login-buttons").style.display = "none";
    document.getElementById("register-buttons").style.display = "block";
  }
}

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  if (!email || !pass) return alert("Isi email dan password!");
  auth
    .signInWithEmailAndPassword(email, pass)
    .catch((err) => alert("Gagal Login: " + err.message));
}

function register() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  if (!email || !pass) return alert("Isi email dan password!");
  if (pass.length < 6) return alert("Password minimal 6!");
  auth
    .createUserWithEmailAndPassword(email, pass)
    .catch((err) => alert("Gagal Daftar: " + err.message));
}

function logout() {
  auth.signOut();
}

function setupDashboardUI() {
  let roleText = isAdmin ? "🌟 ADMIN" : "👤 PELANGGAN";
  document.getElementById("user-email-display").innerText =
    `${roleText} | ${currentUser.email}`;

  if (isAdmin) {
    document.getElementById("admin-stats-panel").style.display = "block";
    document.getElementById("menu-admin-katalog").style.display = "block";
    document.getElementById("kolom-aksi-admin").style.display = "table-cell";
    document.getElementById("filter-admin").style.display = "flex";
    document.getElementById("tabel-title").innerText = "Semua Pesanan Masuk";
  } else {
    document.getElementById("tabel-title").innerText = "Riwayat Pesanan Anda";
  }

  loadDaftarProduk();
  fetchDaftarTransaksi();
}

// ==========================================
// FITUR KATALOG PRODUK
// ==========================================
function tambahProduk() {
  const nama = document.getElementById("namaProdukBaru").value;
  const harga = document.getElementById("hargaProdukBaru").value;
  const kategori =
    document.getElementById("kategoriProdukBaru").value || "Umum";
  const gambar =
    document.getElementById("gambarProdukBaru").value ||
    "https://via.placeholder.com/150/222/fff?text=No+Image";

  if (!nama || !harga) return alert("Isi nama dan harga produk!");
  db.collection("produk")
    .add({
      nama,
      harga: Number(harga),
      kategori,
      gambar,
      timestamp: Date.now(),
    })
    .then(() => {
      document.getElementById("namaProdukBaru").value = "";
      document.getElementById("hargaProdukBaru").value = "";
      document.getElementById("kategoriProdukBaru").value = "";
      document.getElementById("gambarProdukBaru").value = "";
    });
}

function hapusProduk(id) {
  if (confirm("Hapus produk ini dari katalog?"))
    db.collection("produk").doc(id).delete();
}

function loadDaftarProduk() {
  db.collection("produk")
    .orderBy("timestamp", "desc")
    .onSnapshot((snap) => {
      daftarProduk = [];
      const tabelAdmin = document.getElementById("tabel-katalog-admin");
      if (tabelAdmin) tabelAdmin.innerHTML = "";

      snap.forEach((doc) => {
        const p = doc.data();
        p.id = doc.id;
        daftarProduk.push(p);

        if (tabelAdmin) {
          tabelAdmin.innerHTML += `
            <tr>
              <td><img src="${p.gambar}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
              <td>${p.nama}</td>
              <td><span class="badge bg-dark">${p.kategori || "Umum"}</span></td>
              <td>$${p.harga.toLocaleString("en-US")}</td>
              <td><button class="btn-action bg-red" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button></td>
            </tr>`;
        }
      });
      renderKatalogGrid();
    });
}

function renderKatalogGrid(filterKategori = "Semua") {
  const grid = document.getElementById("grid-katalog");
  const filterContainer = document.getElementById("kategori-filter");
  if (!grid || !filterContainer) return;

  // Render Kategori
  let categories = [
    "Semua",
    ...new Set(daftarProduk.map((p) => p.kategori || "Umum")),
  ];
  filterContainer.innerHTML = "";
  categories.forEach((kat) => {
    let btnClass =
      kat === filterKategori ? "btn-kategori active" : "btn-kategori inactive";
    filterContainer.innerHTML += `<button class="${btnClass}" onclick="renderKatalogGrid('${kat}')">${kat}</button>`;
  });

  // Render Kartu Grid
  grid.innerHTML = "";
  daftarProduk.forEach((p) => {
    let kat = p.kategori || "Umum";
    if (filterKategori !== "Semua" && kat !== filterKategori) return;

    grid.innerHTML += `
      <div class="product-card glass-panel" style="padding:15px; text-align:center; position:relative; margin-bottom:0;">
        <span class="badge bg-dark" style="position:absolute; top:10px; right:10px; font-size:10px; z-index:2;">${kat}</span>
        <img src="${p.gambar}" style="width:100%; height:130px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
        <h4 style="margin:5px 0; font-size:16px;">${p.nama}</h4>
        <p style="color:var(--accent-orange); font-weight:bold; margin:5px 0;">$${p.harga.toLocaleString("en-US")}</p>
        
        <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:15px;">
           <input type="number" id="qty-${p.id}" value="1" min="1">
           <button class="btn-primary" onclick="tambahKeKeranjang('${p.id}')" style="padding:8px 12px; font-size:12px; flex:1;">+ Keranjang</button>
        </div>
      </div>
    `;
  });
}

// ==========================================
// FITUR KERANJANG & CHECKOUT
// ==========================================
function tambahKeKeranjang(id) {
  const p = daftarProduk.find((x) => x.id === id);
  const qtyInput = document.getElementById(`qty-${id}`);
  const jumlah = Number(qtyInput.value) || 1;

  if (!p) return;

  let existing = keranjang.find((item) => item.id === id);
  if (existing) {
    existing.jumlah += jumlah;
  } else {
    keranjang.push({
      id: p.id,
      nama: p.nama,
      harga: p.harga,
      kategori: p.kategori || "Umum",
      jumlah: jumlah,
    });
  }
  qtyInput.value = 1;
  renderKeranjang();
}

function hapusDariKeranjang(index) {
  keranjang.splice(index, 1);
  renderKeranjang();
}

function renderKeranjang() {
  const list = document.getElementById("list-keranjang");
  const totalSpan = document.getElementById("total-keranjang");
  if (!list) return;

  list.innerHTML = "";
  let total = 0;

  if (keranjang.length === 0) {
    list.innerHTML =
      "<p style='text-align:center; color:#ccc; font-size:12px;'>Keranjang masih kosong</p>";
  } else {
    keranjang.forEach((item, i) => {
      let subtotal = item.harga * item.jumlah;
      total += subtotal;
      list.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding:10px 0; font-size:14px;">
          <div>
            <strong style="display:block; margin-bottom:3px;">${item.nama}</strong>
            <span style="font-size:11px; color:#aaa; background:rgba(0,0,0,0.3); padding:2px 5px; border-radius:3px;">${item.kategori}</span>
            <span style="font-size:12px; color:#ccc; margin-left:5px;">${item.jumlah}x @ $${item.harga.toLocaleString("en-US")}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="color:white; font-weight:bold;">$${subtotal.toLocaleString("en-US")}</span>
            <button class="btn-action bg-red" onclick="hapusDariKeranjang(${i})" style="padding:3px 7px; font-size:12px; border-radius:4px;">✕</button>
          </div>
        </div>
      `;
    });
  }
  totalSpan.innerText = `$${total.toLocaleString("en-US")}`;
}

function checkout() {
  if (keranjang.length === 0) return alert("Keranjang belanja masih kosong!");
  const catatan = document.getElementById("catatanPesanan").value;
  let totalHargaSemua = keranjang.reduce(
    (sum, item) => sum + item.harga * item.jumlah,
    0,
  );

  db.collection("transaksi")
    .add({
      emailPemesan: currentUser.email,
      items: keranjang,
      totalHargaSemua: totalHargaSemua,
      catatan: catatan || "-",
      statusBayar: "Belum Dibayar",
      statusKerja: "Belum Dibuat",
      timestamp: Date.now(),
    })
    .then(() => {
      alert(
        "Checkout Berhasil! Total yang harus dibayar: $" +
          totalHargaSemua.toLocaleString("en-US"),
      );
      document.getElementById("catatanPesanan").value = "";
      keranjang = [];
      renderKeranjang();
      document.getElementsByClassName("menu-item")[0].click();
    })
    .catch((err) => {
      alert("Gagal melakukan checkout: " + err.message);
    });
}

// ==========================================
// FITUR TRANSAKSI & ADMIN STATISTIK
// ==========================================
function fetchDaftarTransaksi() {
  db.collection("transaksi")
    .orderBy("timestamp", "desc")
    .onSnapshot((snap) => {
      semuaTransaksi = [];
      snap.forEach((doc) => {
        let data = doc.data();
        data.id = doc.id;
        semuaTransaksi.push(data);
      });
      hitungStatistikAdmin();
      renderTabelTransaksi();
    });
}

function renderTabelTransaksi() {
  const tabel = document.getElementById("tabel-transaksi");
  if (!tabel) return;
  tabel.innerHTML = "";

  const filterBayar = isAdmin
    ? document.getElementById("filterBayar").value
    : "Semua";
  const filterKerja = isAdmin
    ? document.getElementById("filterKerja").value
    : "Semua";

  semuaTransaksi.forEach((data) => {
    if (!isAdmin && data.emailPemesan !== currentUser.email) return;
    if (filterBayar !== "Semua" && data.statusBayar !== filterBayar) return;
    if (filterKerja !== "Semua" && data.statusKerja !== filterKerja) return;

    let badgeBayar =
      data.statusBayar === "Sudah Dibayar" ? "bg-green" : "bg-red";
    let badgeKerja =
      data.statusKerja === "Sudah Dibuat" ? "bg-green" : "bg-red";
    let tgl = new Date(data.timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let detailPesananHtml = "";
    if (data.items) {
      let dikelompokkan = {};
      data.items.forEach((i) => {
        if (!dikelompokkan[i.kategori]) dikelompokkan[i.kategori] = [];
        dikelompokkan[i.kategori].push(i);
      });

      for (let kat in dikelompokkan) {
        detailPesananHtml += `<div style="margin-bottom:8px; text-align:left;">
          <span class="badge bg-dark" style="font-size:10px; margin-bottom:3px;">📦 ${kat}</span><br>`;
        dikelompokkan[kat].forEach((i) => {
          detailPesananHtml += `- ${i.nama} (<b style="color:var(--accent-orange);">${i.jumlah}x</b>)<br>`;
        });
        detailPesananHtml += `</div>`;
      }
    } else {
      detailPesananHtml = `<span class="badge bg-dark">📦 Umum</span><br>- ${data.namaBarang} (<b>${data.jumlah}x</b>)`;
    }

    let totalKeseluruhan =
      Number(data.totalHargaSemua) || Number(data.totalHarga) || 0;
    let actionHtml = "";

    if (isAdmin) {
      actionHtml = `<td style="display: table-cell;">
            <button class="btn-action" style="margin-bottom:5px;" onclick="ubahBayar('${data.id}', '${data.statusBayar}')">💳 Bayar</button>
            <button class="btn-action" style="margin-bottom:5px;" onclick="ubahKerja('${data.id}', '${data.statusKerja}')">🛠️ Kerja</button>
            <button class="btn-action bg-red" onclick="hapusTransaksi('${data.id}')" style="color:#F87171;">🗑️ Hapus</button>
        </td>`;
    }

    tabel.innerHTML += `
      <tr>
          <td style="font-size:12px; color:#ccc;">${tgl}</td>
          <td>${data.emailPemesan}</td>
          <td style="line-height:1.4;">${detailPesananHtml}</td>
          <td><strong style="color: var(--accent-orange); font-size:16px;">$${totalKeseluruhan.toLocaleString("en-US")}</strong></td>
          <td>${data.catatan}</td>
          <td><span class="badge ${badgeBayar}">${data.statusBayar}</span></td>
          <td><span class="badge ${badgeKerja}">${data.statusKerja}</span></td>
          ${actionHtml}
      </tr>`;
  });
}

function hitungStatistikAdmin() {
  if (!isAdmin) return;
  let totalPendapatan = 0,
    pendapatanBulanIni = 0;
  const bulanIni = new Date().getMonth(),
    tahunIni = new Date().getFullYear();

  semuaTransaksi.forEach((t) => {
    if (t.statusBayar === "Sudah Dibayar") {
      let total = t.totalHargaSemua || t.totalHarga || 0;
      totalPendapatan += Number(total);
      let tgl = new Date(t.timestamp);
      if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni)
        pendapatanBulanIni += Number(total);
    }
  });

  document.getElementById("total-pendapatan").innerText =
    `$${totalPendapatan.toLocaleString("en-US")}`;
  document.getElementById("pendapatan-bulan-ini").innerText =
    `$${pendapatanBulanIni.toLocaleString("en-US")}`;
  document.getElementById("total-pesanan").innerText = semuaTransaksi.length;
}

function ubahBayar(id, stat) {
  db.collection("transaksi")
    .doc(id)
    .update({
      statusBayar: stat === "Belum Dibayar" ? "Sudah Dibayar" : "Belum Dibayar",
    });
}
function ubahKerja(id, stat) {
  db.collection("transaksi")
    .doc(id)
    .update({
      statusKerja: stat === "Belum Dibuat" ? "Sudah Dibuat" : "Belum Dibuat",
    });
}
function hapusTransaksi(id) {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    db.collection("transaksi").doc(id).delete();
  }
}
