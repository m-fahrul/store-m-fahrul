// Tunggu DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi EmailJS (ganti dengan kredensial Anda dari emailjs.com)
    // Jika belum setup, form akan simulasi sukses (lihat processOrder)
    if (typeof emailjs !== 'undefined') {
        emailjs.init('YOUR_PUBLIC_KEY'); // Ganti dengan public key EmailJS Anda
    }

    let selectedPayment = '';
    let orderId = '';
    let countdownTimer;
    let minPrice = 0;
    let batteryInterval;

    // Update Real-Time Clock
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('id-ID', { hour12: false });
        const date = now.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('time').textContent = time;
        document.getElementById('date').textContent = date;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Update Battery Level (menggunakan Battery Status API)
    function updateBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const level = Math.round(battery.level * 100);
                const fill = document.getElementById('batteryFill');
                const levelSpan = document.getElementById('batteryLevel');
                const chargingIcon = document.getElementById('chargingIcon');

                fill.style.width = level + '%';
                levelSpan.textContent = level + '%';

                if (battery.charging) {
                    chargingIcon.style.display = 'inline';
                    if (!batteryInterval) {
                        batteryInterval = setInterval(updateBattery, 30000); // Update setiap 30 detik saat charging
                    }
                } else {
                    chargingIcon.style.display = 'none';
                    if (batteryInterval) {
                        clearInterval(batteryInterval);
                        batteryInterval = null;
                    }
                }

                // Warna fill berdasarkan level
                if (level < 20) {
                    fill.style.background = 'linear-gradient(90deg, #f44336, #ff9800)';
                } else if (level < 50) {
                    fill.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
                }
            }).catch(err => {
                console.warn('Battery API tidak didukung:', err);
                document.getElementById('batteryLevel').textContent = 'N/A';
            });
        } else {
            document.getElementById('batteryLevel').textContent = 'N/A';
        }
    }
    updateBattery();

    // Fetch IP Address (menggunakan API gratis)
    function fetchIP() {
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                document.getElementById('ipAddress').textContent = data.ip || 'Unknown';
            })
            .catch(err => {
                console.warn('Gagal fetch IP:', err);
                document.getElementById('ipAddress').textContent = 'Error';
            });
    }
    fetchIP();

    // Debounce untuk resize (responsif)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Adjust modal jika perlu (misalnya, force close jika terlalu kecil)
            if (window.innerWidth < 480 && document.getElementById('orderModal').style.display === 'block') {
                closeModal();
            }
        }, 250);
    });

    // Fungsi untuk membuka modal
    window.openModal = function(serviceName, minimumPrice) {
        document.getElementById('service').value = serviceName;
        const amountInput = document.getElementById('amount');
        amountInput.min = minimumPrice;
        amountInput.value = minimumPrice;
        minPrice = minimumPrice;
        document.getElementById('orderModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        generateOrderId();
        document.getElementById('email').focus(); // Auto-focus untuk UX
    };

    // Fungsi untuk menutup modal
    window.closeModal = function() {
        document.getElementById('orderModal').style.display = 'none';
        document.getElementById('paymentGateway').style.display = 'none';
        document.body.style.overflow = 'auto';
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        if (batteryInterval) {
            clearInterval(batteryInterval);
            batteryInterval = null;
        }
        selectedPayment = '';
        document.querySelectorAll('.payment-method[onclick]').forEach(method => {
            method.style.border = '2px solid transparent';
        });
        // Reset form
        document.querySelector('.order-form').reset();
        document.querySelector('.order-form').style.display = 'flex';
    };

    // Event listener untuk close modal saat klik outside
    document.getElementById('orderModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Generate ID Pesanan unik
    function generateOrderId() {
        orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const orderIdElement = document.getElementById('orderId');
        if (orderIdElement) {
            orderIdElement.textContent = orderId;
        }
    }

    // Pilih metode pembayaran (diperbaiki dengan event.currentTarget)
    window.selectPayment = function(method, event) {
        selectedPayment = method;
        document.querySelectorAll('.payment-method[onclick]').forEach(m => {
            m.style.border = '2px solid transparent';
        });
        event.currentTarget.style.border = '2px solid #4facfe';
        
        // Update tampilan e-wallet
        if (method !== 'qris') {
            const walletNumbers = {
                'dana': '083186455058',
                'ovo': '083186455058',
                'gopay': '083892798515'
            };
            const walletNumber = walletNumbers[method] || '083852765078';
            document.getElementById('walletNumber').textContent = walletNumber;
            document.getElementById('walletName').textContent = method.toUpperCase();
        }
    };

    // Copy to Clipboard
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Toast notifikasi sederhana
            showToast('Nomor disalin ke clipboard!', 'success');
        }).catch(err => {
            console.error('Gagal copy:', err);
            showToast('Gagal copy nomor', 'error');
        });
    };

    // Fungsi toast sederhana
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? '#4CAF50' : '#f44336'}; 
            color: white; padding: 15px; border-radius: 10px; z-index: 1001; 
            transform: translateX(100%); transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Proses form order (diperbaiki validasi)
    window.processOrder = function(event) {
        event.preventDefault();
        const service = document.getElementById('service').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const amount = parseInt(document.getElementById('amount').value);
        const details = document.getElementById('details').value;

        if (!selectedPayment) {
            showToast('Pilih metode pembayaran terlebih dahulu!', 'error');
            return;
        }
        if (amount < minPrice) {
            showToast('Jumlah minimal adalah Rp ' + minPrice.toLocaleString(), 'error');
            return;
        }
        if (!email || !phone || !details) {
            showToast('Lengkapi semua field!', 'error');
            return;
        }

        // Kirim email via EmailJS atau simulasi
        const params = {
            service: service,
            email: email,
            phone: phone,
            amount: amount,
            details: details,
            payment_method: selectedPayment.toUpperCase(),
            order_id: orderId
        };

        if (typeof emailjs !== 'undefined' && emailjs.init) {
            emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', params) // Ganti dengan ID Anda
                .then(() => {
                    console.log('Email terkirim!');
                    proceedToPayment(amount);
                })
                .catch(error => {
                    console.error('Gagal kirim email:', error);
                    showToast('Email gagal dikirim, tapi pesanan diproses secara manual.', 'warning');
                    proceedToPayment(amount); // Lanjutkan meski email gagal
                });
        } else {
            console.log('EmailJS belum diinisialisasi. Simulasi sukses:', params);
            showToast('Pesanan diterima (EmailJS belum setup)', 'warning');
            proceedToPayment(amount);
        }
    };

    function proceedToPayment(amount) {
        document.querySelector('.order-form').style.display = 'none';
        document.getElementById('totalAmount').textContent = amount.toLocaleString();
        document.getElementById('transferAmount').textContent = amount.toLocaleString();
        
        // Tampilkan section pembayaran
        if (selectedPayment === 'qris') {
            document.getElementById('qrisSection').style.display = 'block';
        } else {
            document.getElementById('ewalletSection').style.display = 'block';
        }
        document.getElementById('paymentGateway').style.display = 'block';
        
        // Mulai timer 15 menit
        startCountdown(15 * 60);
    }

    // Timer countdown (diperbaiki smooth)
    function startCountdown(seconds) {
        const timerElement = document.getElementById('countdown');
        countdownTimer = setInterval(() => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (seconds <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                showToast('Waktu habis! Pesanan dibatalkan.', 'error');
                closeModal();
            }
            seconds--;
        }, 1000);
    }

    // Konfirmasi pembayaran (dilengkapi)
    window.confirmPayment = function() {
        const btn = document.getElementById('confirmBtn');
        const loading = btn.querySelector('.loading') || document.createElement('span');
        if (!btn.querySelector('.loading')) {
            loading.className = 'loading';
            loading.style.display = 'none';
            btn.appendChild(loading);
        }
        
        loading.style.display = 'inline-block';
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span>Memproses...';

        // Simulasi konfirmasi (ganti dengan API real untuk verifikasi pembayaran)
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = 'Pesanan Dikonfirmasi!';
            showToast('Pembayaran dikonfirmasi! Kami akan proses segera via WhatsApp.', 'success');
            
            // Kirim email konfirmasi (opsional)
            if (typeof emailjs !== 'undefined') {
                emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID_CONFIRM', { // Template konfirmasi terpisah
                    order_id: orderId,
                    status: 'Confirmed'
                }).catch(console.error);
            }
            
            setTimeout(() => {
                closeModal();
            }, 2000);
        }, 2000); // Simulasi delay 2 detik
    };

    // Event listener untuk button close di modal
    document.querySelector('.close').addEventListener('click', closeModal);

    // Tambahkan listener untuk payment methods (untuk kompatibilitas mobile touch)
    document.querySelectorAll('.payment-method[onclick]').forEach(method => {
        method.addEventListener('click', function(e) {
            const methodName = this.querySelector('strong').textContent.toLowerCase().replace(' ', '');
            selectPayment(methodName, e);
        });
        method.addEventListener('touchstart', function(e) { // Untuk mobile
            this.style.transform = 'scale(0.95)';
        });
        method.addEventListener('touchend', function(e) {
            this.style.transform = 'scale(1)';
        });
    });

    // Keyboard support: ESC untuk close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('orderModal').style.display === 'block') {
            closeModal();
        }
    });
});
