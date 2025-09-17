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

let allEntries = [];

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
    // Date filtering logic
    if (dateFrom.value && !dateTo.value) {
        // Filter for dateFrom day only
        const fromDate = new Date(dateFrom.value);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateFrom.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(e => {
            const entryDate = new Date(e.created_at);
            return entryDate >= fromDate && entryDate <= toDate;
        });
    } else if (dateFrom.value && dateTo.value) {
        // Filter for date range
        const fromDate = new Date(dateFrom.value);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(e => {
            const entryDate = new Date(e.created_at);
            return entryDate >= fromDate && entryDate <= toDate;
        });
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
        // Determine which categories to display
        let categoriesToShow;
        if (category.value) {
            // Only show the selected category in the column
            categoriesToShow = [category.value];
        } else {
            // Show all categories for the entry
            categoriesToShow = (e.category || '').split(',').map(cat => cat.trim()).filter(Boolean);
        }
        tr.innerHTML = `
            <td>${escapeHtml(e.title)}</td>
            <td>
            ${categoriesToShow.map(cat =>
                `<span class="badge bg-secondary ms-1">${escapeHtml(cat)}</span>`
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
    allEntries = await fetchEntries();
    // Sort by created_at descending
    allEntries = allEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderEntries(filterEntries(allEntries));
}

// Add controls for bulk mark as paid
const bulkControlsDiv = document.createElement('div');
bulkControlsDiv.className = 'row g-2 align-items-center mb-3';
bulkControlsDiv.style.display = 'none'; // hidden by default

bulkControlsDiv.innerHTML = `
  <div class="col-auto">
    <input type="number" min="0" step="5" id="bulkPaidCount" class="form-control" placeholder="Count" style="width: 100px;" value="0">
  </div>
  <div class="col-auto">
    <button id="bulkMarkPaidBtn" class="btn btn-success">Mark as Paid</button>
  </div>
  <div class="col-auto">
    <span id="paidPendingStats" class="ms-2"></span>
  </div>
`;

// Insert below filterForm
filterForm.parentNode.insertBefore(bulkControlsDiv, filterForm.nextSibling);

const bulkPaidCount = bulkControlsDiv.querySelector('#bulkPaidCount');
const bulkMarkPaidBtn = bulkControlsDiv.querySelector('#bulkMarkPaidBtn');
const paidPendingStats = bulkControlsDiv.querySelector('#paidPendingStats');

// --- Dynamic Filtering ---
function triggerFilter() {
    const filtered = filterEntries(allEntries);
    renderEntries(filtered);

    // Show/hide bulk controls based on filter
    if (
        category.value ||
        titleSearch.value.trim() ||
        dateFrom.value ||
        dateTo.value
    ) {
        bulkControlsDiv.style.display = '';
        updatePaidPendingStats(filtered);
    } else {
        bulkControlsDiv.style.display = 'none';
    }
}

// Update paid/pending stats
function updatePaidPendingStats(filtered) {
    const paid = filtered.filter(e => e.paid).length;
    const pending = filtered.length - paid;
    paidPendingStats.textContent = `Paid: ${paid} | Pending: ${pending}`;
}

// Bulk mark as paid handler
bulkMarkPaidBtn.addEventListener('click', async () => {
    const filtered = filterEntries(allEntries);
    const count = parseInt(bulkPaidCount.value, 10);
    if (!count || count < 1) return;

    // Get oldest pending entries in filtered list
    const pendingEntries = filtered.filter(e => !e.paid)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(0, count);

    if (pendingEntries.length === 0) return;

    for (const entry of pendingEntries) {
        await window.api.togglePaid(entry.id, 1);
    }
    // Reload entries and update stats after marking as paid
    allEntries = await fetchEntries();
    const newFiltered = filterEntries(allEntries);
    renderEntries(newFiltered);
    updatePaidPendingStats(newFiltered);
});

// Listen for changes on all filter fields
category.addEventListener('change', triggerFilter);
titleSearch.addEventListener('input', triggerFilter);
dateFrom.addEventListener('change', triggerFilter);
dateTo.addEventListener('change', triggerFilter);

// Utility to clear all filters and focus category (TomSelect)
function clearFiltersAndFocusCategory() {
    // Clear TomSelect category
    if (category.tomselect) {
        category.tomselect.clear();
        category.tomselect.blur(); // Remove focus if any
        category.tomselect.focus(); // Focus the TomSelect input
    } else {
        category.value = '';
        category.focus();
    }
    // Clear other fields
    titleSearch.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    triggerFilter();
}

// Listen for ESC key to clear filters and focus category
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        clearFiltersAndFocusCategory();
    }
});

// Initial load
loadAndRender();

// Navigation: Go to index.html on F1 key press
window.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    window.api.goToIndex();
  }
});