import { useCallback } from 'react';
interface Toast { title: string; description?: string; variant?: 'default' | 'destructive'; }
export const useToast = () => {
  const toast = useCallback((t: Toast) => {
    const el = document.createElement('div');
    el.className = `fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${t.variant === 'destructive' ? 'bg-red-600' : 'bg-green-600'} transition-all`;
    el.innerHTML = `<p class="font-semibold">${t.title}</p>${t.description ? `<p class="text-sm opacity-90">${t.description}</p>` : ''}`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }, []);
  return { toast };
};
