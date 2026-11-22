import { escapeHtml, loadUsers } from '../storage.js';
import {
  ACTION_KEYS,
  ADMIN_RESOURCE,
  MODULES,
  getEffectivePermission,
  getRoles,
  setRolePermission,
  setUserRole
} from '../domain/permissions.js';

const RESOURCE_ROWS = [
  ...MODULES.map(moduleName => ({ scope: 'modulo', resource: `module:${moduleName}`, label: `Módulo ${moduleName}` })),
  ...MODULES.map(moduleName => ({ scope: 'vista', resource: `view:${moduleName}`, label: `Vista ${moduleName}` })),
  { scope: 'panel', resource: ADMIN_RESOURCE, label: 'Panel de permisos' },
  ...ACTION_KEYS.map(action => ({ scope: 'accion', resource: `action:${action}`, label: `Acción ${action}` }))
];

function cellId(role, resource){
  return `permission-${role}-${resource.replace(/[^a-z0-9]+/gi, '-')}`;
}

function feedback(root, message){
  const element = root.querySelector('#permission-feedback');
  if(element) element.textContent = message;
}

export function renderPermissionsPanel(root){
  if(!root) return;
  const users = loadUsers();
  const roles = getRoles();
  const userSelect = root.querySelector('#permission-user-select');
  const roleSelect = root.querySelector('#permission-user-role-select');
  const matrix = root.querySelector('#permission-matrix-body');
  if(!userSelect || !roleSelect || !matrix) return;

  const previousUser = userSelect.value;
  userSelect.innerHTML = users.map(user => `<option value="${escapeHtml(user.user_id)}">${escapeHtml(user.user_name)}</option>`).join('');
  if(previousUser && users.some(u => String(u.user_id) === previousUser)) userSelect.value = previousUser;

  roleSelect.innerHTML = roles.map(role => `<option value="${escapeHtml(role.role_key)}">${escapeHtml(role.role_label)}</option>`).join('');
  const selectedUser = users.find(u => String(u.user_id) === userSelect.value) || users[0];
  if(selectedUser) roleSelect.value = selectedUser.role;

  matrix.innerHTML = RESOURCE_ROWS.map(row => {
    const cells = roles.map(role => {
      const allowed = getEffectivePermission(role.role_key, row.scope, row.resource, selectedUser?.user_id);
      const locked = row.resource === ADMIN_RESOURCE;
      const disabled = locked && role.is_admin ? ' disabled' : '';
      const checked = allowed ? ' checked' : '';
      return `<td><label class="permission-toggle" for="${escapeHtml(cellId(role.role_key, row.resource))}"><input type="checkbox" id="${escapeHtml(cellId(role.role_key, row.resource))}" data-role="${escapeHtml(role.role_key)}" data-scope="${escapeHtml(row.scope)}" data-resource="${escapeHtml(row.resource)}"${checked}${disabled}/> <span>${allowed ? 'Permitido' : 'Denegado'}</span></label></td>`;
    }).join('');
    return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
  }).join('');
}

export function wirePermissionsPanel(root, onChange){
  if(!root || root.dataset.wired === 'true') return;
  root.dataset.wired = 'true';

  const userSelect = root.querySelector('#permission-user-select');
  const roleSelect = root.querySelector('#permission-user-role-select');
  const applyRole = root.querySelector('#permission-apply-role');
  const matrix = root.querySelector('#permission-matrix-body');

  if(userSelect && roleSelect){
    userSelect.addEventListener('change', () => {
      const user = loadUsers().find(u => String(u.user_id) === userSelect.value);
      if(user) roleSelect.value = user.role;
      renderPermissionsPanel(root);
    });
  }

  if(applyRole){
    applyRole.addEventListener('click', () => {
      const result = setUserRole(Number(userSelect?.value), roleSelect?.value);
      feedback(root, result.success ? `Cargo actualizado para ${loadUsers().find(u => Number(u.user_id) === Number(userSelect.value))?.user_name || 'el usuario'}.` : (result.error || 'No fue posible actualizar el cargo'));
      renderPermissionsPanel(root);
      if(result.success && typeof onChange === 'function') onChange(Number(userSelect.value));
    });
  }

  if(matrix){
    matrix.addEventListener('change', event => {
      const input = event.target.closest('input[data-resource]');
      if(!input) return;
      const result = setRolePermission(input.dataset.role, input.dataset.scope, input.dataset.resource, input.checked);
      feedback(root, result.warning || result.error || `Permiso ${input.dataset.resource} actualizado para ${input.dataset.role}.`);
      renderPermissionsPanel(root);
      if(result.success && typeof onChange === 'function') onChange();
    });
  }
}
