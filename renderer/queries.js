// Import vendor CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import 'tom-select/dist/css/tom-select.css';
import './styles.css';

// Import vendor JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Swal from 'sweetalert2';
import TomSelect from 'tom-select';

// Initialize TomSelect
new TomSelect('#category', {
    create: false,
    maxItems: 1,
    sortField: { field: 'text', direction: 'asc' }
});

const entriesTableBody = document.querySelector('#entriesTable tbody');
const filterForm = document.getElementById('filterForm');
const category = document.getElementById('category');
const titleSearch = document.getElementById('titleSearch');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');

async function fetchEntries() {
    // Replace with your actual API call
    return await window.api.getEntries();
}

function filterEntries(entries) {
    let filtered = entries;
    if (category.value) {
    filtered = filtered.filter(e => (e.category || '').split(',').map(c => c.trim()).includes(category.value));
    }
    if (titleSearch.value.trim()) {
    filtered = filtered.filter(e => (e.title || '').toLowerCase().includes(titleSearch.value.trim().toLowerCase()));
    }
    if (dateFrom.value) {
    filtered = filtered.filter(e => new Date(e.created_at) >= new Date(dateFrom.value));
    }
    if (dateTo.value) {
    const toDate = new Date(dateTo.value);
    toDate.setHours(23,59,59,999);
    filtered = filtered.filter(e => new Date(e.created_at) <= toDate);
    }
    return filtered;
}

function renderEntries(entries) {
    entriesTableBody.innerHTML = '';
    if (!entries.length) {
    entriesTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No entries found</td></tr>`;
    return;
    }
    entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(e.title)}</td>
        <td>Rs. ${e.amount}</td>
        <td>
        ${(e.category || '').split(',').map(cat =>
            `<span class="badge bg-secondary ms-1">${escapeHtml(cat.trim())}</span>`
        ).join('')}
        </td>
        <td>${new Date(e.created_at).toLocaleString()}</td>
        <td>
        <button class="btn btn-sm ${e.paid ? 'btn-success' : 'btn-outline-success'} mark-paid">${e.paid ? 'Paid' : 'Mark Paid'}</button>
        </td>
        <td>
        <button class="btn btn-sm btn-warning edit-entry">Edit</button>
        <button class="btn btn-sm btn-danger delete-entry">Delete</button>
        </td>
    `;
    // Mark Paid/Unpaid
    tr.querySelector('.mark-paid').addEventListener('click', async () => {
        await window.api.togglePaid(e.id, e.paid ? 0 : 1);
        loadAndRender();
    });
    // Edit
    tr.querySelector('.edit-entry').addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
        title: 'Edit Entry',
        html:
            `<input id="swal-title" class="swal2-input" placeholder="Title" value="${escapeHtml(e.title)}">` +
            `<input id="swal-amount" type="number" step="0.01" class="swal2-input" placeholder="Amount" value="${e.amount}">`,
        focusConfirm: false,
        preConfirm: () => {
            return [
            document.getElementById('swal-title').value,
            document.getElementById('swal-amount').value
            ]
        }
        });
        if (formValues) {
        await window.api.editEntry(e.id, {
            title: formValues[0],
            amount: parseFloat(formValues[1]) || 0
        });
        loadAndRender();
        }
    });
    // Delete
    tr.querySelector('.delete-entry').addEventListener('click', async () => {
        const result = await Swal.fire({
        title: 'Delete entry?',
        text: `Do you want to delete "${e.title}"?`,
        icon: 'warning',
        showCancelButton: true
        });
        if (result.isConfirmed) {
        await window.api.deleteEntry(e.id);
        loadAndRender();
        Swal.fire({ toast: true, position: 'bottom-end', timer: 1400, title: 'Deleted', icon: 'success' });
        }
    });
    entriesTableBody.appendChild(tr);
    });
}

function escapeHtml(s) {
    return s ? s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
}

async function loadAndRender() {
    let entries = await fetchEntries();
    // Sort by created_at descending
    entries = entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderEntries(filterEntries(entries));
}

filterForm.addEventListener('submit', ev => {
    ev.preventDefault();
    loadAndRender();
});

// Initial load
loadAndRender();


// Navigation: Go to index.html on F1 key press
window.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    window.api.goToIndex();
  }
});