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
  const category = document.getElementById('category');
  const entriesList = document.getElementById('entriesList');

  // Initialize TomSelect on the category dropdown
  const tomSelectCategory = new TomSelect('#category', { create: false, sortField: { field: 'text', direction: 'asc' } });

  // Focus title field on page load
  title.focus();

  // Move focus to category on Enter in title
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focus TomSelect input
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
      // Focus title after submit (with a slight delay to ensure form reset)
      setTimeout(() => title.focus(), 10);
    }
  });

  async function loadEntries() {
    let entries = await window.api.getEntries();
    entriesList.innerHTML = '';

    if (!entries || entries.length === 0) {
      entriesList.innerHTML = '<div class="text-muted">No entries yet</div>';
      return;
    }

    // Only show the latest 100 entries (assuming entries are sorted oldest to newest)
    entries = entries.slice(-100).reverse(); // newest first

    entries.forEach(e => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `
        <div>
          <div>
            <strong>${escapeHtml(e.title)}</strong>
            ${e.category
              ? e.category.split(',').map(cat =>
                  `<span class="badge bg-secondary ms-1">${escapeHtml(cat.trim())}</span>`
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
    const entry = { title: title.value.trim(), category: Array.from(category.selectedOptions).map(opt => opt.value).join(', ') };
    if (!entry.title) {
      Swal.fire({ icon: 'error', title: 'Title required' });
      return;
    }
    await window.api.addEntry(entry);
    form.reset();
    loadEntries();
    title.focus();
    Swal.fire({ toast: true, position: 'bottom-end', timer: 1400, title: 'Added', icon: 'success' });
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