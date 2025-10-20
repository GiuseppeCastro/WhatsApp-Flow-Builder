let toastTimeout: NodeJS.Timeout | null = null;

export const toast = {
  success: (message: string) => {
    showToast(message, 'success');
  },
  error: (message: string) => {
    showToast(message, 'error');
  },
  info: (message: string) => {
    showToast(message, 'info');
  },
};

function showToast(message: string, type: 'success' | 'error' | 'info'): void {
  // Clear existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Remove existing toast elements
  const existing = document.getElementById('app-toast');
  if (existing) {
    existing.remove();
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
  toast.textContent = message;

  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
