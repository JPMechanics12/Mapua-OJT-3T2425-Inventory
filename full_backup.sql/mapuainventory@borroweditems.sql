-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: borroweditems
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `borroweditems`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `borroweditems` (
  `BorrowID` int unsigned NOT NULL AUTO_INCREMENT,
  `StudentNo` varchar(20) NOT NULL,
  `BorrowedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DueAt` datetime DEFAULT NULL,
  `ReturnedAt` datetime DEFAULT NULL,
  `Status` enum('Borrowed','Returned','Overdue') NOT NULL DEFAULT 'Borrowed',
  `ItemID` int NOT NULL,
  `Quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`BorrowID`),
  KEY `idx_borrow_status` (`Status`),
  KEY `idx_borrow_student` (`StudentNo`,`Status`),
  KEY `fk_borroweditem_item` (`ItemID`),
  CONSTRAINT `borroweditems_ibfk_1` FOREIGN KEY (`StudentNo`) REFERENCES `students` (`StudentNo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_borroweditem_item` FOREIGN KEY (`ItemID`) REFERENCES `items` (`ItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
