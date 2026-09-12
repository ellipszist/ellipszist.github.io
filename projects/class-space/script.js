const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    // 1. Mock Users & Rooms
    const SEED_USERS = [
      { username: 'admin', password: '123', name: 'ผศ.ดร. นันทิพัฒน์ (ผู้ดูแล)', role: 'admin' },
      { username: 'student1', password: '123', name: 'สมชาย พงษ์สถิตย์', role: 'user' }
    ];

    const roomOptions = [
      'Lab 101 - Smart Computer Lab (40 ที่นั่ง)',
      'Room 201 - Lecture Theater (60 ที่นั่ง)',
      'Room 301 - Seminar & Workshop Room (20 ที่นั่ง)'
    ];

    // Reactive State
    const currentUser = ref(JSON.parse(sessionStorage.getItem('currentUser')) || null);
    const bookings = ref(JSON.parse(localStorage.getItem('bookings')) || []);
    const currentFilter = ref('all'); // 'all' | 'mine'
    const toasts = ref([]);
    const showModal = ref(false);
    const pendingCancelId = ref(null);

    const loginForm = ref({ username: '', password: '' });
    const bookingForm = ref({
      room: roomOptions[0],
      date: new Date().toISOString().split('T')[0],
      timeSlot: '09:00 - 12:00',
      purpose: ''
    });

    const todayDate = computed(() => new Date().toISOString().split('T')[0]);

    // Bootstrap local storage
    onMounted(() => {
      if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(SEED_USERS));
      }
      if (!localStorage.getItem('bookings')) {
        localStorage.setItem('bookings', JSON.stringify([]));
      }
    });

    // 2. Computed Properties
    const myBookingsCount = computed(() => {
      if (!currentUser.value) return 0;
      return bookings.value.filter(b => b.bookedBy === currentUser.value.username).length;
    });

    const filteredBookings = computed(() => {
      let list = [...bookings.value];
      if (currentFilter.value === 'mine' && currentUser.value) {
        list = list.filter(b => b.bookedBy === currentUser.value.username);
      }
      return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // 3. Helper Notifications
    const showToast = (message, type = 'success') => {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, 3000);
    };

    // 4. Authentication Logic
    const handleLogin = () => {
      const users = JSON.parse(localStorage.getItem('users')) || SEED_USERS;
      const user = users.find(
        u => u.username === loginForm.value.username.trim() && u.password === loginForm.value.password.trim()
      );

      if (user) {
        currentUser.value = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        loginForm.value = { username: '', password: '' };
        showToast(`ยินดีต้อนรับคุณ ${user.name}`);
      } else {
        showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
      }
    };

    const fillCredentials = (username, password) => {
      loginForm.value.username = username;
      loginForm.value.password = password;
      showToast(`เติมข้อมูลสำหรับ ${username} แล้ว`);
    };

    const logout = () => {
      currentUser.value = null;
      sessionStorage.removeItem('currentUser');
      showToast('ออกจากระบบเรียบร้อยแล้ว');
    };

    // 5. Booking Logic & Collision Detection
    const handleBooking = () => {
      const isConflict = bookings.value.some(b => 
        b.room === bookingForm.value.room && 
        b.date === bookingForm.value.date && 
        b.timeSlot === bookingForm.value.timeSlot
      );

      if (isConflict) {
        showToast(`ห้องนี้ถูกจองแล้วในวันที่ ${bookingForm.value.date} (${bookingForm.value.timeSlot})`, 'error');
        return;
      }

      const newBooking = {
        id: 'BK-' + Date.now(),
        room: bookingForm.value.room,
        date: bookingForm.value.date,
        timeSlot: bookingForm.value.timeSlot,
        purpose: bookingForm.value.purpose.trim(),
        bookedBy: currentUser.value.username,
        bookedByName: currentUser.value.name,
        createdAt: new Date().toISOString()
      };

      bookings.value.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings.value));
      bookingForm.value.purpose = '';
      showToast('🎉 จองห้องเรียนสำเร็จเรียบร้อยแล้ว!');
    };

    // 6. Cancellation & Permissions
    const canCancel = (item) => {
      if (!currentUser.value) return false;
      return currentUser.value.role === 'admin' || currentUser.value.username === item.bookedBy;
    };

    const promptCancel = (id) => {
      pendingCancelId.value = id;
      showModal.value = true;
    };

    const closeModal = () => {
      pendingCancelId.value = null;
      showModal.value = false;
    };

    const confirmCancelBooking = () => {
      if (!pendingCancelId.value) return;

      const target = bookings.value.find(b => b.id === pendingCancelId.value);
      if (!target || !canCancel(target)) {
        showToast('คุณไม่มีสิทธิ์ยกเลิกการจองนี้', 'error');
        closeModal();
        return;
      }

      bookings.value = bookings.value.filter(b => b.id !== pendingCancelId.value);
      localStorage.setItem('bookings', JSON.stringify(bookings.value));
      closeModal();
      showToast('ยกเลิกรายการจองห้องเรียบร้อยแล้ว');
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    return {
      currentUser,
      bookings,
      currentFilter,
      toasts,
      showModal,
      loginForm,
      bookingForm,
      roomOptions,
      todayDate,
      myBookingsCount,
      filteredBookings,
      handleLogin,
      fillCredentials,
      logout,
      handleBooking,
      canCancel,
      promptCancel,
      closeModal,
      confirmCancelBooking,
      formatDate
    };
  }
}).mount('#app');