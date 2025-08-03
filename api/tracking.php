<?php
require_once 'db-connect.php';
header('Content-Type: application/json');

try {
    $sql = "SELECT ItemDetails, Status, BorrowedAt, ReturnedAt FROM BorrowedItems ORDER BY BorrowedAt DESC";
    $stmt = $pdo->query($sql);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
