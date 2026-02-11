import { state } from '../store/state';

export const setupNotificationListeners = () => {
    const bell = document.getElementById('notification-bell');
    const center = document.getElementById('notification-center');
    const clearBtn = document.getElementById('clear-notifications');

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        center.classList.toggle('hidden');
        renderNotifications();
    });

    clearBtn.addEventListener('click', () => {
        localStorage.removeItem('xgaffer_notifications');
        renderNotifications();
        updateBellBadge();
    });

    document.addEventListener('click', (e) => {
        if (!center.contains(e.target) && !bell.contains(e.target)) {
            center.classList.add('hidden');
        }
    });

    // Initial Badge Check
    updateBellBadge();
};

export const addNotification = (title, message, type = 'info') => {
    const notifications = JSON.parse(localStorage.getItem('xgaffer_notifications') || '[]');
    const newNotif = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    };

    notifications.unshift(newNotif);
    localStorage.setItem('xgaffer_notifications', JSON.stringify(notifications.slice(0, 50)));

    updateBellBadge();
    showToast(title, message);
};

const renderNotifications = () => {
    const list = document.getElementById('notification-list');
    const notifications = JSON.parse(localStorage.getItem('xgaffer_notifications') || '[]');

    if (notifications.length === 0) {
        list.innerHTML = '<div class="empty-notifications">No new updates, Gaffer.</div>';
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.type}">
            <div class="notif-title"><strong>${n.title}</strong></div>
            <div class="notif-desc">${n.message}</div>
            <div class="notif-time">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `).join('');
};

const updateBellBadge = () => {
    const badge = document.querySelector('.notification-badge');
    const notifications = JSON.parse(localStorage.getItem('xgaffer_notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
};

const showToast = (title, message) => {
    // Simple toast implementation or use an existing library
    const toast = document.createElement('div');
    toast.className = 'toast glass-heavy';
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
};
