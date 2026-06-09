'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export function useAuth(redirectIfUnauthenticated = true) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      if (redirectIfUnauthenticated) router.push('/login');
      setLoading(false);
      return;
    }

    setToken(storedToken);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch { /* ignore */ }
    }

    const controller = new AbortController();

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const userData = { id: data.id, name: data.name, email: data.email, role: data.role };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (redirectIfUnauthenticated) {
          router.push('/login');
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (redirectIfUnauthenticated) router.push('/login');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [redirectIfUnauthenticated, router]);

  return { token, user, loading };
}
