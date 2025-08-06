-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: users
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `UserID` int unsigned NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `ContactNo` varchar(30) DEFAULT NULL,
  `PasswordHash` varchar(255) DEFAULT NULL,
  `Role` enum('Admin','Viewer','Ticketing','Inventory') NOT NULL DEFAULT 'Inventory',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `idx_users_role` (`Role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
