// Import vendor CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import 'tom-select/dist/css/tom-select.css';
import './styles.css';

// Import vendor JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Swal from 'sweetalert2';
import TomSelect from 'tom-select';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('entryForm');
  const title = document.getElementById('title');
  const category = document.getElementById('category');
  const entriesList = document.getElementById('entriesList');

  // --- Populate category select from DB ---
  async function populateCategories() {
    const categories = await window.api.getCategories();
    category.innerHTML = ''; // Clear existing options
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      opt.selected = true; // Select all by default
      category.appendChild(opt);
    });
    // Re-init TomSelect after options update
    if (category.tomselect) {
      category.tomselect.destroy();
    }
    new TomSelect('#category', { 
      create: false, 
      sortField: { field: 'text', direction: 'asc' },
      maxItems: null // Allow selecting all
    });
  }

  await populateCategories();

  // Focus title field on page load
  title.focus();

  // Move focus to category on Enter in title
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (category.tomselect) {
        category.tomselect.focus();
      } else {
        category.focus();
      }
    }
  });

  // On Enter in category, submit form and focus title
  category.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.requestSubmit();
      setTimeout(() => title.focus(), 10);
    }
  });

  async function loadEntries() {
    let entries = await window.api.getEntries();

    // Filter for today's entries only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    entries = entries.filter(e => {
      const entryDate = new Date(e.created_at);
      return entryDate >= today && entryDate < tomorrow;
    });

    // Sort by created_at descending
    entries = entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
          <div>
            <strong>${escapeHtml(e.title)}</strong>
            ${e.categories && e.categories.length
              ? e.categories.map(cat =>
                  `<span class="badge bg-secondary ms-1">${escapeHtml(cat)}</span>`
                ).join('')
              : ''
            }
          </div>
          <div class="text-muted">${new Date(e.created_at).toLocaleString()}</div>
        </div>
      `;
      entriesList.appendChild(item);
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const entry = {
      title: title.value.trim(),
      categories: Array.from(category.selectedOptions).map(opt => opt.value)
    };
    if (!entry.title) {
      Swal.fire({ icon: 'error', title: 'Title required' });
      return;
    }

    // Check if title exists in the database via backend
    const exists = await window.api.titleExists(entry.title);
    if (exists) {
      Swal.fire({ icon: 'error', title: 'Title already exists' });
      return;
    }

    await window.api.addEntry(entry);
    title.value = ''; // Only clear the title field
    loadEntries();
    title.focus();
    Swal.fire({ toast: true, position: 'bottom-end', timer: 1400, title: 'Added', icon: 'success' });
  });

  // Mask title field: only allow up to 6 digits
  title.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    e.target.value = val;
  });

  function escapeHtml(s) {
    return s ? s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
  }

  loadEntries();
});

// Navigate to queries.html on F2 key press
window.addEventListener('keydown', (e) => {
  if (e.key === 'F2') {
    window.api.goToQueries();
  }
});