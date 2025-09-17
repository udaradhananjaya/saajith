import{T as m,S as i}from"./tom-select.complete-Ddof_xjP.js";document.addEventListener("DOMContentLoaded",()=>{const o=document.getElementById("entryForm"),c=document.getElementById("title"),l=document.getElementById("amount"),u=document.getElementById("category"),s=document.getElementById("entriesList");new m("#category",{create:!1,sortField:{field:"text",direction:"asc"}});async function a(){const e=await window.api.getEntries();if(s.innerHTML="",!e||e.length===0){s.innerHTML='<div class="text-muted">No entries yet</div>';return}e.forEach(t=>{const n=document.createElement("div");n.className="list-group-item d-flex justify-content-between align-items-center",n.innerHTML=`
        <div>
          <div>
            <strong>${d(t.title)}</strong>
            ${t.category?t.category.split(",").map(r=>`<span class="badge bg-secondary ms-1">${d(r.trim())}</span>`).join(""):""}
          </div>
          <div class="text-muted">Rs. ${t.amount} — ${new Date(t.created_at).toLocaleString()}</div>
        </div>
        <div>
          <button class="btn btn-sm ${t.paid?"btn-success":"btn-outline-success"} me-2 toggle-paid">${t.paid?"Paid":"Mark Paid"}</button>
          <button class="btn btn-sm btn-danger delete-entry">Delete</button>
        </div>
      `,n.querySelector(".toggle-paid").addEventListener("click",async()=>{await window.api.togglePaid(t.id,t.paid?0:1);const r=t.paid?"Marked unpaid":"Marked paid";i.fire({toast:!0,position:"bottom-end",timer:1500,title:r,icon:"success"}),a()}),n.querySelector(".delete-entry").addEventListener("click",async()=>{(await i.fire({title:"Delete entry?",text:`Do you want to delete "${t.title}"?`,icon:"warning",showCancelButton:!0})).isConfirmed&&(await window.api.deleteEntry(t.id),i.fire({toast:!0,position:"bottom-end",timer:1400,title:"Deleted",icon:"success"}),a())}),s.appendChild(n)})}o.addEventListener("submit",async e=>{e.preventDefault();const t={title:c.value.trim(),amount:parseFloat(l.value)||0,category:Array.from(u.selectedOptions).map(n=>n.value).join(", ")};if(!t.title){i.fire({icon:"error",title:"Title required"});return}await window.api.addEntry(t),o.reset(),a(),i.fire({toast:!0,position:"bottom-end",timer:1400,title:"Added",icon:"success"})});function d(e){return e?e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]):""}a()});window.addEventListener("keydown",o=>{o.key==="F2"&&window.api.goToQueries()});
