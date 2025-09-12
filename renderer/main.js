// Import vendor CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import 'tom-select/dist/css/tom-select.css';
import './styles.css';

// Import vendor JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Swal from 'sweetalert2';
import TomSelect from 'tom-select';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entryForm');
  const title = document.getElementById('title');
  const amount = document.getElementById('amount');
  const category = document.getElementById('category');
  const entriesList = document.getElementById('entriesList');

  // Initialize TomSelect on the category dropdown
  new TomSelect('#category', { create: false, sortField: { field: 'text', direction: 'asc' } });

  async function loadEntries() {
    const entries = await window.api.getEntries();
    entriesList.innerHTML = '';

    if (!entries || entries.length === 0) {
      entriesList.innerHTML = '<div class="text-muted">No entries yet</div>';
      return;
    }

    entries.forEach(e => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `
        <div>
          <div><strong>${escapeHtml(e.title)}</strong> <small class="text-muted">(${e.category || ''})</small></div>
          <div class="text-muted">Rs ${e.amount} — ${new Date(e.created_at).toLocaleString()}</div>
        </div>
        <div>
          <button class="btn btn-sm ${e.paid ? 'btn-success' : 'btn-outline-success'} me-2 toggle-paid">${e.paid ? 'Paid' : 'Mark Paid'}</button>
          <button class="btn btn-sm btn-danger delete-entry">Delete</button>
        </div>
      `;

      // mark paid/unpaid
      item.querySelector('.toggle-paid').addEventListener('click', async () => {
        await window.api.togglePaid(e.id, e.paid ? 0 : 1);
        const action = e.paid ? 'Marked unpaid' : 'Marked paid';
        Swal.fire({ toast: true, position: 'top-end', timer: 1500, title: action, icon: 'success' });
        loadEntries();
      });

      // delete entry
      item.querySelector('.delete-entry').addEventListener('click', async () => {
        const result = await Swal.fire({
          title: 'Delete entry?',
          text: `Do you want to delete "${e.title}"?`,
          icon: 'warning',
          showCancelButton: true
        });
        if (result.isConfirmed) {
          await window.api.deleteEntry(e.id);
          Swal.fire({ toast: true, position: 'top-end', timer: 1400, title: 'Deleted', icon: 'success' });
          loadEntries();
        }
      });

      entriesList.appendChild(item);
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const entry = { title: title.value.trim(), amount: parseFloat(amount.value) || 0, category: category.value };
    if (!entry.title) {
      Swal.fire({ icon: 'error', title: 'Title required' });
      return;
    }
    await window.api.addEntry(entry);
    form.reset();
    loadEntries();
    Swal.fire({ toast: true, position: 'top-end', timer: 1400, title: 'Added', icon: 'success' });
  });

  function escapeHtml(s) {
    return s ? s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
  }

  loadEntries();
});
