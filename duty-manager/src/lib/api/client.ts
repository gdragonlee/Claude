// Mock API client - localStorage 기반
// bkend.ai 연동 시 이 파일만 교체하면 됩니다

function generateId(): string {
  return crypto.randomUUID();
}

function getStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

export { generateId, getStore, setStore, getCurrentUser };
