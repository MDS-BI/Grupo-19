import { describe, it, expect, beforeEach } from 'vitest';
import { saveProductCategories, saveUsers, loadProducts } from '../../src/storage.js';
import { createProduct, updateProduct, setProductStatus, searchProducts } from '../../src/domain/products.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const CATEGORY = { category_id: 1, category_name: 'Electrónica' };
const USER = { user_id: 1, user_name: 'Ana', role: 'administrador', email: 'ana@empresa.cl' };

function basePayload(overrides = {}){
  return {
    sku: 'SKU-001',
    productName: 'Mouse inalámbrico',
    categoryId: String(CATEGORY.category_id),
    salePrice: '10000',
    costPrice: '6000',
    userId: String(USER.user_id),
    ...overrides
  };
}

beforeEach(() => {
  store.clear();
  saveProductCategories([CATEGORY]);
  saveUsers([USER]);
});

describe('products domain', () => {
  it('requires name, SKU, sale price, category and acting user (FR-040, FR-043)', () => {
    const result = createProduct(basePayload({ sku: '', productName: '', categoryId: '', salePrice: '', userId: '' }));
    expect(result.success).toBe(false);
    expect(result.errors.sku).toBeDefined();
    expect(result.errors.productName).toBeDefined();
    expect(result.errors.categoryId).toBeDefined();
    expect(result.errors.salePrice).toBeDefined();
    expect(result.errors.userId).toBeDefined();
  });

  it('rejects a duplicate SKU (FR-042)', () => {
    createProduct(basePayload());
    const result = createProduct(basePayload({ productName: 'Otro producto' }));
    expect(result.success).toBe(false);
    expect(result.errors.sku).toContain('ya existe');
  });

  it('allows editing the SKU of a product that already has movement history (FR-088)', () => {
    const created = createProduct(basePayload()).product;
    const result = updateProduct(created.product_id, basePayload({ sku: 'SKU-002' }));
    expect(result.success).toBe(true);
    expect(result.product.sku).toBe('SKU-002');
  });

  it('rejects negative prices (FR-043)', () => {
    expect(createProduct(basePayload({ salePrice: '-1' })).success).toBe(false);
    expect(createProduct(basePayload({ costPrice: '-1' })).success).toBe(false);
  });

  it('allows saving when cost price exceeds sale price, with a non-blocking warning (FR-089)', () => {
    const result = createProduct(basePayload({ salePrice: '100', costPrice: '150' }));
    expect(result.success).toBe(true);
    expect(result.warnings.costPrice).toContain('supera');
  });

  it('defaults status to "activo" on creation without asking for it (FR-091)', () => {
    const result = createProduct(basePayload());
    expect(result.product.status).toBe('activo');
  });

  it('records created_by/updated_by and timestamps automatically (FR-044)', () => {
    const result = createProduct(basePayload());
    expect(result.product.created_by).toBe(USER.user_id);
    expect(result.product.updated_by).toBe(USER.user_id);
    expect(result.product.created_at).toBeDefined();
    expect(result.product.updated_at).toBeDefined();
  });

  it('toggles active/inactive status even when the product still has stock (FR-045, FR-090)', () => {
    const created = createProduct(basePayload()).product;
    const result = setProductStatus(created.product_id, 'inactivo', USER.user_id);
    expect(result.success).toBe(true);
    expect(loadProducts()[0].status).toBe('inactivo');
  });

  it('rejects an unknown category (FR-040)', () => {
    const result = createProduct(basePayload({ categoryId: '999' }));
    expect(result.success).toBe(false);
    expect(result.errors.categoryId).toBeDefined();
  });

  it('rejects an unknown acting user (FR-058 pattern applied to products)', () => {
    const result = createProduct(basePayload({ userId: '999' }));
    expect(result.success).toBe(false);
    expect(result.errors.userId).toBeDefined();
  });

  it('searches by name, SKU and category (FR-004 pattern applied to products)', () => {
    createProduct(basePayload());
    createProduct(basePayload({ sku: 'SKU-777', productName: 'Teclado mecánico' }));
    expect(searchProducts('mouse').length).toBe(1);
    expect(searchProducts('SKU-777').length).toBe(1);
    expect(searchProducts('electrónica').length).toBe(2);
    expect(searchProducts('').length).toBe(2);
  });
});
