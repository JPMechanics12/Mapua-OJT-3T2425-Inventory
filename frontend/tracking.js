document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const headcountContainer = document.getElementById('item-headcount');
  const itemSelect = document.getElementById('itemSelect');
  const studentIdInput = document.getElementById('studentIdInput');
  const borrowQuantityInput = document.getElementById('borrowQuantityInput');
  const borrowButton = document.getElementById('borrowButton');
  const messageBorrowDiv = document.getElementById('message-borrow');
  const messageReturnDiv = document.getElementById('message-return');
  const historyStudentIdInput = document.getElementById('historyStudentIdInput');
  const fetchHistoryButton = document.getElementById('fetchHistoryButton');
  const studentHistoryResults = document.getElementById('student-history-results');
  const returnStudentIdInput = document.getElementById('returnStudentIdInput');
  const borrowedItemsContainer = document.getElementById('borrowed-items-container');

  // User avatar + greeting
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{"name":"Admin"}');
    document.querySelectorAll('.sidebar-profile .avatar').forEach(el => {
      el.textContent = user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    });
    const nm = document.querySelector('.sidebar-profile .user-name');
    if (nm) nm.textContent = `Hi, ${user.name.split(' ')[0]}!`;
  } catch {}

  // Theme toggle
  const toggleBtn = document.querySelector('.theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      toggleBtn.textContent = dark ? '☀️' : '🌙';
    });
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      toggleBtn.textContent = '☀️';
    }
  }

  // Utilities
  const showMessage = (el, message, type) => {
    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  };

  // API calls
  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/items/getall');
      const items = await res.json();

      headcountContainer.innerHTML = '';
      itemSelect.innerHTML = '<option value="">Select an Item</option>';

      items.forEach(item => {
        const statusClass = item.CurrentAvailable === item.MaxQuantity ? 'green' : 'red';
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
          <div class="item-status-indicator ${statusClass}"></div>
          <div class="item-details">
            <span class="item-name">${item.ItemName}</span>
            <span class="item-quantity">Available: ${item.CurrentAvailable} / ${item.MaxQuantity}</span>
          </div>`;
        headcountContainer.appendChild(card);

        const opt = document.createElement('option');
        opt.value = item.ItemID;
        opt.textContent = `${item.ItemName} (${item.CurrentAvailable} available)`;
        itemSelect.appendChild(opt);
      });
    } catch (e) {
      console.error('Error fetching items:', e);
      headcountContainer.innerHTML = '<p>Failed to load items.</p>';
    }
  };

  const handleBorrow = async () => {
    const studentId = studentIdInput.value;
    const itemId = itemSelect.value;
    const quantity = borrowQuantityInput.value;
    if (!studentId || !itemId || !quantity || quantity <= 0) {
      showMessage(messageBorrowDiv, 'Please enter a Student ID, select an item, and enter a valid quantity.', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/borrow', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ studentId, itemId, quantity })
      });
      const result = await res.json();
      if (result.status === 'success') {
        showMessage(messageBorrowDiv, result.message, 'success');
        await fetchItems();
        studentIdInput.value = '';
        itemSelect.value = '';
        borrowQuantityInput.value = '1';
      } else {
        showMessage(messageBorrowDiv, result.message, 'error');
      }
    } catch (e) {
      console.error('Error borrowing item:', e);
      showMessage(messageBorrowDiv, 'Failed to borrow item. Check console.', 'error');
    }
  };

  const handleReturn = async (borrowId, quantity, itemName) => {
    if (!borrowId || !quantity || quantity <= 0) {
      showMessage(messageReturnDiv, 'Error: Missing Borrow ID or invalid quantity.', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/return', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ borrowId, quantity })
      });
      const result = await res.json();
      if (result.status === 'success') {
        showMessage(messageReturnDiv, `Successfully returned ${quantity} of ${itemName}.`, 'success');
        await fetchItems();
        const studentId = returnStudentIdInput.value;
        if (studentId) fetchBorrowedItems(studentId);
      } else {
        showMessage(messageReturnDiv, `Return failed: ${result.message}`, 'error');
      }
    } catch (e) {
      console.error('Error during return:', e);
      showMessage(messageReturnDiv, 'Failed to return item. Check console.', 'error');
    }
  };

  const handleReturnAll = async (studentId) => {
    const ok = confirm('Return ALL borrowed items for this student?');
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:5000/borrowed-items/${studentId}`);
      const result = await res.json();
      if (result.status !== 'success') {
        showMessage(messageReturnDiv, `Error fetching items to return: ${result.message}`, 'error');
        return;
      }
      const items = result.items;
      if (!items.length) {
        showMessage(messageReturnDiv, 'No items to return.', 'success');
        return;
      }
      for (const it of items) {
        const r = await fetch('http://localhost:5000/return', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ borrowId: it.BorrowID, quantity: it.Quantity })
        });
        const rr = await r.json();
        if (rr.status !== 'success') {
          showMessage(messageReturnDiv, `Failed to return ${it.ItemName}: ${rr.message}`, 'error');
          return;
        }
      }
      showMessage(messageReturnDiv, 'Successfully returned all items.', 'success');
      await fetchItems();
      fetchBorrowedItems(studentId);
    } catch (e) {
      console.error('Error returning all items:', e);
      showMessage(messageReturnDiv, 'Failed to return all items. Check console.', 'error');
    }
  };

  const fetchBorrowedItems = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:5000/borrowed-items/${studentId}`);
      const result = await res.json();

      borrowedItemsContainer.innerHTML = '';
      if (res.status === 404 || result.status === 'error') {
        borrowedItemsContainer.innerHTML = `<p>${result.message}</p>`;
        return;
      }
      if (!result.items.length) {
        borrowedItemsContainer.innerHTML = '<p>No items currently borrowed by this student.</p>';
        return;
      }
      result.items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'borrowed-item-card';
        itemCard.innerHTML = `
          <div class="borrowed-item-details">
            <p class="borrowed-item-name">${item.ItemName}</p>
            <p class="borrowed-item-borrowed-at">Borrowed: ${new Date(item.BorrowedAt).toLocaleDateString()}</p>
          </div>
          <div class="return-controls">
            <label>Qty to return:</label>
            <input type="number" value="${item.Quantity}" min="1" max="${item.Quantity}" data-borrow-id="${item.BorrowID}" class="return-quantity-input">
            <button class="btn-primary return-item-btn">Return</button>
          </div>`;
        const returnBtn = itemCard.querySelector('.return-item-btn');
        const qtyInput = itemCard.querySelector('.return-quantity-input');
        returnBtn.addEventListener('click', () => {
          const qty = qtyInput.value;
          handleReturn(item.BorrowID, qty, item.ItemName);
        });
        borrowedItemsContainer.appendChild(itemCard);
      });

      const returnAllBtn = document.createElement('button');
      returnAllBtn.id = 'returnAllButton';
      returnAllBtn.textContent = 'Return All Items';
      returnAllBtn.className = 'btn-return-all';
      returnAllBtn.addEventListener('click', () => handleReturnAll(studentId));
      borrowedItemsContainer.appendChild(returnAllBtn);
    } catch (e) {
      console.error('Error fetching borrowed items:', e);
      borrowedItemsContainer.innerHTML = '<p>Failed to load borrowed items.</p>';
    }
  };

  const fetchHistory = async () => {
    const studentId = historyStudentIdInput.value;
    studentHistoryResults.innerHTML = '';
    if (!studentId) {
      studentHistoryResults.innerHTML = '<p>Please enter a student ID.</p>';
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/history/${studentId}`);
      if (!res.ok) {
        studentHistoryResults.innerHTML = '<p>Error fetching history.</p>';
        return;
      }
      const history = await res.json();
      if (history.status === 'error') {
        studentHistoryResults.innerHTML = `<p>${history.message}</p>`;
        return;
      }
      if (!history.length) {
        studentHistoryResults.innerHTML = '<p>No history found for this student.</p>';
        return;
      }
      history.forEach(record => {
        const card = document.createElement('div');
        card.className = 'history-card';
        const statusClass = record.BorrowStatus === 'Returned'
          ? 'status-returned'
          : record.BorrowStatus === 'Overdue'
            ? 'status-overdue'
            : 'status-borrowed';
        const borrowedDate = record.BorrowedAt;
        const returnedDate = record.ReturnedAt ? record.ReturnedAt : 'Not yet returned';
        card.innerHTML = `
          <p><strong>Borrow ID:</strong> ${record.BorrowID}</p>
          <p><strong>Item:</strong> ${record.ItemName}</p>
          <p><strong>Quantity:</strong> ${record.Quantity}</p>
          <p><strong>Borrowed At:</strong> ${borrowedDate}</p>
          <p><strong>Returned At:</strong> ${returnedDate}</p>
          <p><strong>Status:</strong> <span class="${statusClass}">${record.BorrowStatus}</span></p>`;
        studentHistoryResults.appendChild(card);
      });
    } catch (e) {
      console.error('Error fetching history:', e);
      studentHistoryResults.innerHTML = '<p>Failed to fetch history.</p>';
    }
  };

  // Events
  borrowButton.addEventListener('click', handleBorrow);
  fetchHistoryButton.addEventListener('click', fetchHistory);
  returnStudentIdInput.addEventListener('change', (e) => {
    const studentId = e.target.value;
    if (studentId) fetchBorrowedItems(studentId);
    else borrowedItemsContainer.innerHTML = '<p>Scan a student\'s RFID to see their borrowed items.</p>';
  });

  // Init
  fetchItems();
});