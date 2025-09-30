const form = document.getElementById('categoryForm');
const catName = document.getElementById('catName');
const catRate = document.getElementById('catRate');
const tableBody = document.querySelector('#categoriesTable tbody');

async function loadCategories() {
  const categories = await window.api.getCategories();
  tableBody.innerHTML = '';
  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${cat.name}" data-id="${cat.id}" class="edit-name" /></td>
      <td><input type="number" step="0.01" value="${cat.rate}" data-id="${cat.id}" class="edit-rate" /></td>
      <td>
        <button data-id="${cat.id}" class="delete-cat">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Edit handlers
  tableBody.querySelectorAll('.edit-name').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const name = e.target.value;
      const rate = tableBody.querySelector(`.edit-rate[data-id="${id}"]`).value;
      await window.api.editCategory(Number(id), name, Number(rate));
      loadCategories();
    });
  });
  tableBody.querySelectorAll('.edit-rate').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const rate = e.target.value;
      const name = tableBody.querySelector(`.edit-name[data-id="${id}"]`).value;
      await window.api.editCategory(Number(id), name, Number(rate));
      loadCategories();
    });
  });
  tableBody.querySelectorAll('.delete-cat').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await window.api.deleteCategory(Number(id));
      loadCategories();
    });
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await window.api.addCategory(catName.value, Number(catRate.value));
  form.reset();
  loadCategories();
});

loadCategories();