<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

// GET: Fetch all borrowed items for a student
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['studentNo'])) {
    $studentNo = $_GET['studentNo'];

    $sql = "SELECT * FROM BorrowedItems WHERE StudentNo = :studentNo ORDER BY BorrowedAt DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':studentNo' => $studentNo]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($records) {
        echo json_encode(['status' => 'success', 'data' => $records]);
    } else {
        echo json_encode(['status' => 'empty', 'message' => 'No borrow history found.']);
    }
    exit;
}

// POST: Borrowing an item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'borrow') {
    $studentNo    = $_POST['studentNo'] ?? '';
    $itemCategory = $_POST['itemCategory'] ?? '';
    $itemDetails  = $_POST['itemDetails'] ?? '';
    $dueAt        = $_POST['dueAt'] ?? null;

    if (empty($studentNo) || empty($itemCategory) || empty($itemDetails)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $sql = "INSERT INTO BorrowedItems (StudentNo, ItemCategory, ItemDetails, DueAt, Status, BorrowedAt)
            VALUES (:studentNo, :itemCategory, :itemDetails, :dueAt, 'Borrowed', NOW())";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':studentNo'    => $studentNo,
        ':itemCategory' => $itemCategory,
        ':itemDetails'  => $itemDetails,
        ':dueAt'        => $dueAt
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Item borrowed successfully']);
    exit;
}

// POST: Returning an item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'return') {
    $borrowId = $_POST['borrowId'] ?? null;

    if (!$borrowId) {
        echo json_encode(['status' => 'error', 'message' => 'Missing borrow ID']);
        exit;
    }

    $sql = "UPDATE BorrowedItems SET Status = 'Returned', ReturnedAt = NOW() WHERE ID = :borrowId";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':borrowId' => $borrowId]);

    echo json_encode(['status' => 'success', 'message' => 'Item returned successfully']);
    exit;
}
?>
