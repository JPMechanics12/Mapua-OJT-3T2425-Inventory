document.addEventListener('DOMContentLoaded', () => {
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

    // New elements for the improved return form
    const returnStudentIdInput = document.getElementById('returnStudentIdInput');
    const borrowedItemsContainer = document.getElementById('borrowed-items-container');

    const showMessage = (element, message, type) => {
        console.log(`Displaying message in ${element.id}: ${message} (${type})`);
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    };

    const fetchItems = async () => {
        console.log("Fetching all items to update headcount...");
        try {
            const response = await fetch('http://localhost:5000/items/getall');
            const items = await response.json();
            
            headcountContainer.innerHTML = '';
            itemSelect.innerHTML = '<option value="">Select an Item</option>';
            items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.classList.add('item-card');
                const statusClass = item.CurrentAvailable === item.MaxQuantity ? 'green' : 'red';
                
                itemCard.innerHTML = `
                    <div class="item-status-indicator ${statusClass}"></div>
                    <div class="item-details">
                        <span class="item-name">${item.ItemName}</span>
                        <span class="item-quantity">Available: ${item.CurrentAvailable} / ${item.MaxQuantity}</span>
                    </div>
                `;
                headcountContainer.appendChild(itemCard);

                const option = document.createElement('option');
                option.value = item.ItemID;
                option.textContent = `${item.ItemName} (${item.CurrentAvailable} available)`;
                itemSelect.appendChild(option);
            });
            console.log("Item headcount updated successfully.");
        } catch (error) {
            console.error('Error fetching items:', error);
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
            const response = await fetch('http://localhost:5000/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, itemId, quantity }),
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                showMessage(messageBorrowDiv, result.message, 'success');
                fetchItems();
                studentIdInput.value = '';
                itemSelect.value = '';
                borrowQuantityInput.value = '1';
            } else {
                showMessage(messageBorrowDiv, result.message, 'error');
                console.error('Borrow failed:', result.message);
            }
        } catch (error) {
            console.error('Error borrowing item:', error);
            showMessage(messageBorrowDiv, 'Failed to borrow item. Check the console for details.', 'error');
        }
    };

    const handleReturn = async (borrowId, quantity, itemName) => {
        console.log(`--- Return action initiated ---`);
        console.log(`Attempting to return item with Borrow ID: ${borrowId}, Quantity: ${quantity}`);
        
        if (!borrowId || !quantity || quantity <= 0) {
            showMessage(messageReturnDiv, 'Error: Missing Borrow ID or invalid quantity.', 'error');
            console.error('Return failed due to missing data:', { borrowId, quantity });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ borrowId, quantity }),
            });
            
            console.log('API response received.');
            const result = await response.json();
            console.log('API response body:', result);
            
            if (result.status === 'success') {
                console.log('API reported success. Now updating UI...');
                showMessage(messageReturnDiv, `Successfully returned ${quantity} of ${itemName}.`, 'success');
                
                fetchItems(); // Update the main item headcount
                
                const studentId = returnStudentIdInput.value;
                if (studentId) {
                    console.log('Calling fetchBorrowedItems to refresh the list.');
                    fetchBorrowedItems(studentId); // Refresh the borrowed items list
                } else {
                    console.warn('Student ID is missing, cannot refresh borrowed items list.');
                }
            } else {
                 showMessage(messageReturnDiv, `Return failed: ${result.message}`, 'error');
                 console.error('Return failed:', result.message);
            }
        } catch (error) {
            console.error('Error during return API call:', error);
            showMessage(messageReturnDiv, 'Failed to return item. Check the console for details.', 'error');
        }
    };

    const handleReturnAll = async (studentId) => {
        const confirmReturn = confirm("Are you sure you want to return ALL borrowed items for this student?");
        if (!confirmReturn) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5000/borrowed-items/${studentId}`);
            const result = await response.json();
            
            if (result.status !== 'success') {
                showMessage(messageReturnDiv, `Error fetching items to return: ${result.message}`, 'error');
                return;
            }

            const borrowedItems = result.items;
            if (borrowedItems.length === 0) {
                showMessage(messageReturnDiv, "No items to return.", 'success');
                return;
            }

            let allSucceeded = true;
            for (const item of borrowedItems) {
                const returnResponse = await fetch('http://localhost:5000/return', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ borrowId: item.BorrowID, quantity: item.Quantity }),
                });
                const returnResult = await returnResponse.json();
                if (returnResult.status !== 'success') {
                     allSucceeded = false;
                     showMessage(messageReturnDiv, `Failed to return item ${item.ItemName}: ${returnResult.message}`, 'error');
                     break;
                }
            }
            
            if (allSucceeded) {
                showMessage(messageReturnDiv, "Successfully returned all items.", 'success');
                fetchItems();
                fetchBorrowedItems(studentId);
            }
            
        } catch (error) {
            console.error('Error returning all items:', error);
            showMessage(messageReturnDiv, "Failed to return all items. Check console for details.", 'error');
        }
    };
    
    const fetchBorrowedItems = async (studentId) => {
        console.log(`Fetching borrowed items for student ID: ${studentId}`);
        try {
            const response = await fetch(`http://localhost:5000/borrowed-items/${studentId}`);
            const result = await response.json();
            
            console.log('Received borrowed items data:', result);

            borrowedItemsContainer.innerHTML = '';
            
            if (response.status === 404 || result.status === 'error') {
                borrowedItemsContainer.innerHTML = `<p>${result.message}</p>`;
                console.error('Error fetching borrowed items:', result.message);
                return;
            }
            
            if (result.items.length === 0) {
                borrowedItemsContainer.innerHTML = '<p>No items currently borrowed by this student.</p>';
                return;
            }

            console.log('Successfully fetched borrowed items:', result.items);

            result.items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.classList.add('borrowed-item-card');
                itemCard.innerHTML = `
                    <div class="borrowed-item-details">
                        <p class="borrowed-item-name">${item.ItemName}</p>
                        <p class="borrowed-item-borrowed-at">Borrowed: ${new Date(item.BorrowedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="return-controls">
                        <label>Qty to return: </label>
                        <input type="number" value="${item.Quantity}" min="1" max="${item.Quantity}" data-borrow-id="${item.BorrowID}" class="return-quantity-input">
                        <button class="btn-primary return-item-btn">Return</button>
                    </div>
                `;
                
                const returnBtn = itemCard.querySelector('.return-item-btn');
                const quantityInput = itemCard.querySelector('.return-quantity-input');
                
                returnBtn.addEventListener('click', () => {
                    const quantity = quantityInput.value;
                    const borrowId = item.BorrowID;
                    handleReturn(borrowId, quantity, item.ItemName);
                });
                
                borrowedItemsContainer.appendChild(itemCard);
            });
            
            const returnAllBtn = document.createElement('button');
            returnAllBtn.id = 'returnAllButton';
            returnAllBtn.textContent = 'Return All Items';
            returnAllBtn.classList.add('btn-return-all');
            returnAllBtn.addEventListener('click', () => handleReturnAll(studentId));
            borrowedItemsContainer.appendChild(returnAllBtn);

        } catch (error) {
            console.error('Error fetching borrowed items:', error);
            borrowedItemsContainer.innerHTML = '<p>Failed to load borrowed items. Check the console for details.</p>';
        }
    };

    const fetchHistory = async () => {
        const studentId = historyStudentIdInput.value;
        studentHistoryResults.innerHTML = ''; // Clear previous results
        
        console.log(`--- Fetching history for Student ID: ${studentId} ---`);

        if (!studentId) {
            studentHistoryResults.innerHTML = '<p>Please enter a student ID.</p>';
            console.warn('History fetch aborted: Student ID is empty.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/history/${studentId}`);
            
            if (!response.ok) {
                console.error(`API returned an error: ${response.status} - ${response.statusText}`);
                studentHistoryResults.innerHTML = `<p class="text-red-500">Error fetching history. Student ID may not exist.</p>`;
                return;
            }

            const history = await response.json();
            console.log('Received history data:', history);

            if (history.status === 'error') {
                studentHistoryResults.innerHTML = `<p class="text-red-500">${history.message}</p>`;
                console.error('History fetch failed:', history.message);
                return;
            }

            if (history.length === 0) {
                studentHistoryResults.innerHTML = '<p>No history found for this student.</p>';
                return;
            }

            history.forEach(record => {
                const historyCard = document.createElement('div');
                historyCard.classList.add('history-card');

                const statusClass = record.BorrowStatus === 'Returned' ? 'status-returned' : 
                                      record.BorrowStatus === 'Overdue' ? 'status-overdue' : 'status-borrowed';

                const borrowedDate = record.BorrowedAt;
                const returnedDate = record.ReturnedAt ? record.ReturnedAt : 'Not yet returned';

                historyCard.innerHTML = `
                    <p><strong>Borrow ID:</strong> ${record.BorrowID}</p>
                    <p><strong>Item:</strong> ${record.ItemName}</p>
                    <p><strong>Quantity:</strong> ${record.Quantity}</p>
                    <p><strong>Borrowed At:</strong> ${borrowedDate}</p>
                    <p><strong>Returned At:</strong> ${returnedDate}</p>
                    <p><strong>Status:</strong> <span class="${statusClass}">${record.BorrowStatus}</span></p>
                `;
                studentHistoryResults.appendChild(historyCard);
            });
            console.log('History display updated successfully.');
        } catch (error) {
            console.error('Error fetching history:', error);
            studentHistoryResults.innerHTML = '<p class="text-red-500">Failed to fetch history.</p>';
        }
    };
    
    // Event Listeners
    borrowButton.addEventListener('click', handleBorrow);
    fetchHistoryButton.addEventListener('click', fetchHistory);

    // New event listener for the return form
    returnStudentIdInput.addEventListener('change', (event) => {
        const studentId = event.target.value;
        if (studentId) {
            fetchBorrowedItems(studentId);
        } else {
            borrowedItemsContainer.innerHTML = '<p>Scan a student\'s RFID to see their borrowed items.</p>';
        }
    });

    fetchItems();
});