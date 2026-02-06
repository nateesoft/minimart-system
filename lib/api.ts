import type { Product, Category } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api';

// --- Token Management ---
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pos_token', token);
    } else {
      localStorage.removeItem('pos_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('pos_token');
  }
  return authToken;
}

// --- Error Class ---
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Base Fetch Helper ---
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || `Request failed: ${response.status}`,
    );
  }

  return response.json();
}

// --- Backend Response Types ---
interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  _count: { products: number };
}

interface ApiProduct {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  barcode: string;
  stock: number;
  image: string | null;
  unit: string;
  isActive: boolean;
  category: {
    id: number;
    slug: string;
    name: string;
    icon: string | null;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface LoginResponse {
  access_token: string;
  user: { id: number; username: string; name: string; role: string };
}

// --- Data Mappers ---
function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category.slug,
    price: p.price,
    barcode: p.barcode,
    stock: p.stock,
    image: p.image || '📦',
    unit: p.unit,
  };
}

function mapCategories(cats: ApiCategory[]): Category[] {
  return [
    { id: 'all', name: 'ทั้งหมด', icon: '🏪' },
    ...cats.map((c) => ({
      id: c.slug,
      name: c.name,
      icon: c.icon || '📂',
    })),
  ];
}

// --- Auth API ---
export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(result.access_token);
  return result;
}

// --- Categories API ---
export async function fetchCategories(): Promise<Category[]> {
  const cats = await apiFetch<ApiCategory[]>('/categories?isActive=true');
  return mapCategories(cats);
}

// --- Products API ---
export async function fetchProducts(params?: {
  category?: string;
  search?: string;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params?.search) {
    searchParams.set('search', params.search);
  }
  searchParams.set('limit', '200');

  const qs = searchParams.toString();
  const result = await apiFetch<PaginatedResponse<ApiProduct>>(
    `/products${qs ? `?${qs}` : ''}`,
  );
  return result.data.map(mapProduct);
}

export async function fetchProductByBarcode(
  barcode: string,
): Promise<Product> {
  const p = await apiFetch<ApiProduct>(`/products/barcode/${barcode}`);
  return mapProduct(p);
}

// --- Transactions API ---
interface CreateTransactionPayload {
  items: { productId: number; quantity: number }[];
  discount?: number;
  payment: {
    method: string;
    amount: number;
  };
  notes?: string;
}

export async function createTransaction(payload: CreateTransactionPayload) {
  return apiFetch<unknown>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --- Transaction History API ---
export interface TransactionItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
}

export interface Transaction {
  id: number;
  subtotal: number;
  discount: number;
  total: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED';
  createdAt: string;
  items: TransactionItem[];
  payment: {
    method: 'CASH' | 'CARD' | 'QR';
    amount: number;
    change: number;
  } | null;
}

export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Transaction[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));

  return apiFetch<{ data: Transaction[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/transactions?${searchParams.toString()}`
  );
}
