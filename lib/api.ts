import type {
  Product,
  Category,
  Promotion,
  CreatePromotionData,
  PromotionCalculationResult,
  CartItem,
  InventoryTransaction,
  StockCount,
  StockOverview,
  LowStockProduct,
  CreateReceivingData,
  CreateIssuingData,
  CreateStockCountData,
  InventoryTransactionType,
  Member,
  PointTransaction,
  CreateMemberData,
  UpdateMemberData,
  User,
  Role,
  Permission,
  AuthUser,
  LoginResponse,
  CreateUserData,
  UpdateUserData,
} from '@/types';

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

interface ApiLoginResponse {
  access_token: string;
  user: AuthUser;
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
  const result = await apiFetch<ApiLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(result.access_token);
  return result;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
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
  memberId?: number;
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
  memberId?: number;
  pointsEarned?: number;
  member?: {
    id: number;
    phone: string;
    firstName: string;
    lastName?: string;
    totalPoints: number;
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

// --- Refund Transaction API ---
export async function refundTransaction(
  transactionId: number,
  reason?: string,
): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${transactionId}/refund`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

// --- Promotions API ---
export async function fetchPromotions(params?: {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: Promotion[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 50));

  return apiFetch<{ data: Promotion[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/promotions?${searchParams.toString()}`
  );
}

export async function fetchActivePromotions(): Promise<Promotion[]> {
  return apiFetch<Promotion[]>('/promotions/active');
}

export async function fetchPromotion(id: number): Promise<Promotion> {
  return apiFetch<Promotion>(`/promotions/${id}`);
}

export async function createPromotion(data: CreatePromotionData): Promise<Promotion> {
  return apiFetch<Promotion>('/promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePromotion(id: number, data: Partial<CreatePromotionData>): Promise<Promotion> {
  return apiFetch<Promotion>(`/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePromotion(id: number): Promise<void> {
  await apiFetch<void>(`/promotions/${id}`, {
    method: 'DELETE',
  });
}

export async function togglePromotionActive(id: number): Promise<Promotion> {
  return apiFetch<Promotion>(`/promotions/${id}/toggle`, {
    method: 'PATCH',
  });
}

export async function calculateCartPromotions(
  items: { productId: number; quantity: number; unitPrice: number }[]
): Promise<PromotionCalculationResult> {
  return apiFetch<PromotionCalculationResult>('/promotions/calculate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// --- Products API (Admin) ---
export interface ApiProductFull {
  id: number;
  name: string;
  price: number;
  image: string | null;
  barcode: string;
  stock: number;
  unit: string;
  category: {
    id: number;
    slug: string;
    name: string;
  };
}

export async function fetchAllProducts(): Promise<ApiProductFull[]> {
  const result = await apiFetch<PaginatedResponse<ApiProductFull>>('/products?limit=500');
  return result.data;
}

// ============================================
// Inventory API - ระบบคลังสินค้า
// ============================================

// รับสินค้าเข้า (Bulk)
export async function createReceiving(data: CreateReceivingData): Promise<{
  message: string;
  transactions: InventoryTransaction[];
}> {
  return apiFetch('/inventory/receiving', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// จ่ายสินค้าออก
export async function createIssuing(data: CreateIssuingData): Promise<InventoryTransaction> {
  return apiFetch('/inventory/issuing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ดูประวัติการเคลื่อนไหว
export async function fetchInventoryTransactions(params?: {
  productId?: number;
  type?: InventoryTransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: InventoryTransaction[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.productId) searchParams.set('productId', String(params.productId));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));

  return apiFetch(`/inventory/transactions?${searchParams.toString()}`);
}

// ดูประวัติของสินค้าเฉพาะ
export async function fetchProductInventoryHistory(productId: number): Promise<InventoryTransaction[]> {
  return apiFetch(`/inventory/transactions/product/${productId}`);
}

// ภาพรวมสต็อก
export async function fetchStockOverview(): Promise<StockOverview> {
  return apiFetch('/inventory/stock-overview');
}

// สินค้าใกล้หมด
export async function fetchLowStockProducts(): Promise<LowStockProduct[]> {
  return apiFetch('/inventory/low-stock');
}

// บันทึกการนับสต็อก
export async function createStockCount(data: CreateStockCountData): Promise<StockCount> {
  return apiFetch('/inventory/stock-count', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ดูรายการนับสต็อก
export async function fetchStockCounts(params?: {
  productId?: number;
  isAdjusted?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: StockCount[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.productId) searchParams.set('productId', String(params.productId));
  if (params?.isAdjusted !== undefined) searchParams.set('isAdjusted', String(params.isAdjusted));
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));

  return apiFetch(`/inventory/stock-counts?${searchParams.toString()}`);
}

// ปรับปรุงสต็อกจากการนับ
export async function adjustStockCount(id: number): Promise<StockCount> {
  return apiFetch(`/inventory/stock-counts/${id}/adjust`, {
    method: 'PATCH',
  });
}

// ============================================
// Members API - ระบบสมาชิก
// ============================================

// ลงทะเบียนสมาชิกใหม่
export async function createMember(data: CreateMemberData): Promise<Member> {
  return apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ค้นหาสมาชิก
export async function fetchMembers(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: Member[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));

  return apiFetch(`/members?${searchParams.toString()}`);
}

// ค้นหาสมาชิกด้วย ID
export async function fetchMemberById(id: number): Promise<Member> {
  return apiFetch(`/members/${id}`);
}

// ค้นหาสมาชิกด้วยเบอร์โทร
export async function fetchMemberByPhone(phone: string): Promise<Member> {
  return apiFetch(`/members/phone/${phone}`);
}

// แก้ไขข้อมูลสมาชิก
export async function updateMember(id: number, data: UpdateMemberData): Promise<Member> {
  return apiFetch(`/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ดูประวัติแต้มของสมาชิก
export async function fetchMemberPoints(memberId: number, params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: PointTransaction[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));

  return apiFetch(`/members/${memberId}/points?${searchParams.toString()}`);
}

// ปรับแต้มสมาชิก (Admin)
export async function adjustMemberPoints(memberId: number, data: {
  points: number;
  description?: string;
}): Promise<Member> {
  return apiFetch(`/members/${memberId}/points/adjust`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Users API - ระบบผู้ใช้งาน
// ============================================

export async function fetchUsers(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<User[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));

  const qs = searchParams.toString();
  return apiFetch<User[]>(`/users${qs ? `?${qs}` : ''}`);
}

export async function fetchUser(id: number): Promise<User> {
  return apiFetch<User>(`/users/${id}`);
}

export async function createUser(data: CreateUserData): Promise<User> {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: number,
  data: UpdateUserData
): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
}

// ============================================
// Roles API - ระบบบทบาท
// ============================================

export async function fetchRoles(): Promise<Role[]> {
  return apiFetch<Role[]>('/roles');
}

export async function fetchRole(id: number): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`);
}

export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: number[];
}): Promise<Role> {
  return apiFetch<Role>('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(
  id: number,
  data: {
    displayName?: string;
    description?: string;
    permissionIds?: number[];
  }
): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================
// Permissions API - ระบบสิทธิ์
// ============================================

export async function fetchPermissions(): Promise<Permission[]> {
  return apiFetch<Permission[]>('/permissions');
}

export async function fetchPermissionsGrouped(): Promise<
  Record<string, Permission[]>
> {
  return apiFetch<Record<string, Permission[]>>('/permissions/grouped');
}
