import{T as m,S as r}from"./tom-select.complete-Ddof_xjP.js";new m("#category",{create:!1,maxItems:1,sortField:{field:"text",direction:"asc"}});const o=document.querySelector("#entriesTable tbody"),w=document.getElementById("filterForm"),d=document.getElementById("category"),s=document.getElementById("titleSearch"),c=document.getElementById("dateFrom"),u=document.getElementById("dateTo");async function f(){return await window.api.getEntries()}function y(n){let t=n;if(d.value&&(t=t.filter(e=>(e.category||"").split(",").map(a=>a.trim()).includes(d.value))),s.value.trim()&&(t=t.filter(e=>(e.title||"").toLowerCase().includes(s.value.trim().toLowerCase()))),c.value&&(t=t.filter(e=>new Date(e.created_at)>=new Date(c.value))),u.value){const e=new Date(u.value);e.setHours(23,59,59,999),t=t.filter(a=>new Date(a.created_at)<=e)}return t}function p(n){if(o.innerHTML="",!n.length){o.innerHTML='<tr><td colspan="6" class="text-center text-muted">No entries found</td></tr>';return}n.forEach(t=>{const e=document.createElement("tr");e.innerHTML=`
        <td>${l(t.title)}</td>
        <td>Rs. ${t.amount}</td>
        <td>
        ${(t.category||"").split(",").map(a=>`<span class="badge bg-secondary ms-1">${l(a.trim())}</span>`).join("")}
        </td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>
        <button class="btn btn-sm ${t.paid?"btn-success":"btn-outline-success"} mark-paid">${t.paid?"Paid":"Mark Paid"}</button>
        </td>
        <td>
        <button class="btn btn-sm btn-warning edit-entry">Edit</button>
        <button class="btn btn-sm btn-danger delete-entry">Delete</button>
        </td>
    `,e.querySelector(".mark-paid").addEventListener("click",async()=>{await window.api.togglePaid(t.id,t.paid?0:1),i()}),e.querySelector(".edit-entry").addEventListener("click",async()=>{const{value:a}=await r.fire({title:"Edit Entry",html:`<input id="swal-title" class="swal2-input" placeholder="Title" value="${l(t.title)}"><input id="swal-amount" type="number" step="0.01" class="swal2-input" placeholder="Amount" value="${t.amount}">`,focusConfirm:!1,preConfirm:()=>[document.getElementById("swal-title").value,document.getElementById("swal-amount").value]});a&&(await window.api.editEntry(t.id,{title:a[0],amount:parseFloat(a[1])||0}),i())}),e.querySelector(".delete-entry").addEventListener("click",async()=>{(await r.fire({title:"Delete entry?",text:`Do you want to delete "${t.title}"?`,icon:"warning",showCancelButton:!0})).isConfirmed&&(await window.api.deleteEntry(t.id),i(),r.fire({toast:!0,position:"bottom-end",timer:1400,title:"Deleted",icon:"success"}))}),o.appendChild(e)})}function l(n){return n?n.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]):""}async function i(){let n=await f();n=n.sort((t,e)=>new Date(e.created_at)-new Date(t.created_at)),p(y(n))}w.addEventListener("submit",n=>{n.preventDefault(),i()});i();window.addEventListener("keydown",n=>{n.key==="F1"&&window.api.goToIndex()});
