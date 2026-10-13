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
let isAuthModeLogin = true;

const isLoginPage = document.getElementById("auth-section") !== null;
const isDashboardPage = document.getElementById("dashboard-section") !== null;

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

function buatPesananLaluKeBeranda() {
  buatPesanan();
  document.getElementsByClassName("menu-item")[0].click();
}

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

function tambahProduk() {
  const nama = document.getElementById("namaProdukBaru").value;
  const harga = document.getElementById("hargaProdukBaru").value;
  if (!nama || !harga) return alert("Isi nama dan harga!");
  db.collection("produk")
    .add({ nama: nama, harga: Number(harga), timestamp: Date.now() })
    .then(() => {
      document.getElementById("namaProdukBaru").value = "";
      document.getElementById("hargaProdukBaru").value = "";
    });
}

function hapusProduk(id) {
  if (confirm("Hapus produk ini?")) db.collection("produk").doc(id).delete();
}

function loadDaftarProduk() {
  db.collection("produk")
    .orderBy("timestamp", "desc")
    .onSnapshot((snap) => {
      const select = document.getElementById("pilihProduk");
      const tabelAdmin = document.getElementById("tabel-katalog-admin");
      if (select)
        select.innerHTML = '<option value="">-- Pilih Produk --</option>';
      if (tabelAdmin) tabelAdmin.innerHTML = "";
      daftarProduk = [];

      snap.forEach((doc) => {
        const p = doc.data();
        p.id = doc.id;
        daftarProduk.push(p);
        if (select)
          select.innerHTML += `<option value="${p.id}">${p.nama} - Rp ${p.harga.toLocaleString("id-ID")}</option>`;
        if (tabelAdmin)
          tabelAdmin.innerHTML += `<tr><td>${p.nama}</td><td>Rp ${p.harga.toLocaleString("id-ID")}</td><td><button class="btn-action bg-red" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button></td></tr>`;
      });
    });
}

function buatPesanan() {
  const produkId = document.getElementById("pilihProduk").value;
  const jumlahInput = document.getElementById("jumlahPesanan");
  const jumlah = Number(jumlahInput ? jumlahInput.value : 1) || 1;
  const catatan = document.getElementById("catatanPesanan").value;

  if (!produkId) return alert("Pilih produk terlebih dahulu!");
  if (jumlah < 1) return alert("Jumlah minimal 1!");

  const p = daftarProduk.find((x) => x.id === produkId);
  if (!p) return alert("Produk tidak ditemukan!");

  const hargaSatuan = Number(p.harga) || 0;
  const totalHarga = hargaSatuan * jumlah;

  db.collection("transaksi")
    .add({
      emailPemesan: currentUser.email,
      namaBarang: p.nama,
      hargaSatuan: hargaSatuan,
      jumlah: jumlah,
      totalHarga: totalHarga,
      catatan: catatan || "-",
      statusBayar: "Belum Dibayar",
      statusKerja: "Belum Dibuat",
      timestamp: Date.now(),
    })
    .then(() => {
      alert(
        "Pesanan Berhasil Dibuat! Total: Rp " +
          totalHarga.toLocaleString("id-ID"),
      );
      document.getElementById("catatanPesanan").value = "";
      if (jumlahInput) jumlahInput.value = "1";
    })
    .catch((err) => {
      alert("Gagal membuat pesanan: " + err.message);
    });
}

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

    let jumlah = Number(data.jumlah) || 1;
    let hargaSatuan = Number(data.hargaSatuan);

    if (!hargaSatuan && data.harga) {
      hargaSatuan = Number(data.harga) / jumlah;
    } else if (!hargaSatuan) {
      hargaSatuan = 0;
    }

    let totalHarga = Number(data.totalHarga) || hargaSatuan * jumlah;

    let actionHtml = "";
    if (isAdmin) {
      actionHtml = `<td style="display: table-cell;">
                <button class="btn-action" onclick="ubahBayar('${data.id}', '${data.statusBayar}')">💳 Bayar</button>
                <button class="btn-action" onclick="ubahKerja('${data.id}', '${data.statusKerja}')">🛠️ Kerja</button>
            </td>`;
    }

    let tgl = new Date(data.timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    // URUTAN TD HARUS SISNYA SAMA PERSIS DENGAN TH DI HTML
    tabel.innerHTML += `
            <tr>
                <td style="font-size:12px; color:#ccc;">${tgl}</td>
                <td>${data.emailPemesan}</td>
                <td><strong>${data.namaBarang}</strong></td>
                <td>Rp ${hargaSatuan.toLocaleString("id-ID")}</td>
                <td><span class="badge bg-dark">${jumlah} pcs</span></td>
                <td><strong style="color: var(--accent-orange);">Rp ${totalHarga.toLocaleString("id-ID")}</strong></td>
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
      let total = t.totalHarga || t.hargaSatuan * t.jumlah || t.harga || 0;
      totalPendapatan += Number(total);
      let tgl = new Date(t.timestamp);
      if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni)
        pendapatanBulanIni += Number(total);
    }
  });

  document.getElementById("total-pendapatan").innerText =
    `Rp ${totalPendapatan.toLocaleString("id-ID")}`;
  document.getElementById("pendapatan-bulan-ini").innerText =
    `Rp ${pendapatanBulanIni.toLocaleString("id-ID")}`;
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
