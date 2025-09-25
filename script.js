// Inisialisasi EmailJS (ganti dengan kredensial Anda)
emailjs.init('YOUR_PUBLIC_KEY'); // Ganti dengan public key EmailJS Anda

let selectedPayment = '';
let orderId = '';
let countdownTimer;
let minPrice = 0;

// Fungsi untuk membuka modal
function openModal(serviceName, minimumPrice) {
    document.getElementById('service').value = serviceName;
    document.getElementById('amount').min = minimumPrice;
    document.getElementById('amount').value = minimumPrice;
    document.getElementById('orderModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Cegah scroll
    minPrice = minimumPrice;
    generateOrderId();
}

// Fungsi untuk menutup modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('paymentGateway').style.display = 'none';
    document.body.style.overflow = 'auto';
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    selectedPayment = '';
    document.querySelectorAll('.payment-method[onclick]').forEach(method => {
        method.style.border = '2px solid transparent';
    });
}

// Generate ID Pesanan unik
function generateOrderId() {
    orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    document.getElementById('orderId').textContent = orderId;
}

// Pilih metode pembayaran
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method[onclick]').forEach(m => {
        m.style.border = '2px solid transparent';
    });
    event.target.style.border = '2px solid #4facfe';
    
    // Update tampilan e-wallet
    if (method !== 'qris') {
        const walletNumbers = {
            'dana': '083186455058',
            'ovo': '083186455058',
            'gopay': '083892798515'
        };
        document.getElementById('walletNumber').textContent = walletNumbers[method] || '083852765078';
        document.getElementById('walletName').textContent = method.toUpperCase();
    }
}

// Proses form order
function processOrder(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const service = document.getElementById('service').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const amount = parseInt(document.getElementById('amount').value);
    const details = document.getElementById('details').value;

    if (!selectedPayment) {
        alert('Pilih metode pembayaran terlebih dahulu!');
        return;
    }

    // Kirim email via EmailJS
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', { // Ganti dengan ID Anda
        service: service,
        email: email,
        phone: phone,
        amount: amount,
        details: details,
        payment_method: selectedPayment.toUpperCase(),
        order_id: orderId
    }).then(() => {
        console.log('Email terkirim!');
        document.querySelector('.order-form').style.display = 'none';
        document.getElementById('totalAmount').textContent = amount.toLocaleString();
        document.getElementById('transferAmount').textContent = amount.toLocaleString();
        
        // Tampilkan section pembayaran berdasarkan metode
        if (selectedPayment === 'qris') {
            document.getElementById('qrisSection').style.display = 'block';
        } else {
            document.getElementById('ewalletSection').style.display = 'block';
        }
        document.getElementById('paymentGateway').style.display = 'block';
        
        // Mulai timer 15 menit
        startCountdown(15 * 60);
    }).catch(error => {
        console.error('Gagal kirim email:', error);
        alert('Terjadi kesalahan. Coba lagi!');
    });
}

// Timer countdown
function startCountdown(seconds) {
    const timerElement = document.getElementById('countdown');
    countdownTimer = setInterval(() => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(countdownTimer);
            alert('Waktu habis! Pesanan dibatalkan.');
            closeModal();
        }
        seconds--;
    }, 1000);
}

// Konfirmasi pembayaran
function confirmPayment() {
    const btn = document.getElementById('confirmBtn');
    const loading = btn.querySelector('.loading');
    loading.style.display = 'inline-block';
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Memproses...';

    // Simulasi konfirmasi (ganti dengan API real jika ada)
    setTimeout(() => {
        alert('Pembayaran dikonfirmasi
