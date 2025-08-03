document.addEventListener("DOMContentLoaded", function () {
  fetch("../api/borrow.php?studentNo=2023001234")
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById("tracking-body"); // match the <tbody> ID in tracking.html
      tbody.innerHTML = ""; // clear any existing rows

      data.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${item.ItemID || "—"}</td>
          <td>${item.ItemDetails || "—"}</td>
          <td><span class="status">${item.Status}</span></td>
          <td>${item.BorrowedAt || "—"}</td>
          <td>${item.ReturnedAt || "—"}</td>
        `;

        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Tracking data load failed:", err);
      const tbody = document.getElementById("tracking-body");
      tbody.innerHTML = "<tr><td colspan='5'>⚠️ Failed to load tracking data.</td></tr>";
    });
});
