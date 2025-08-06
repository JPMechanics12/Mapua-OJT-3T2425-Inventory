-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: students
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `students`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `students` (
  `StudentNo` varchar(20) NOT NULL,
  `rfidTag` varchar(255) DEFAULT NULL,
  `studentId` varchar(255) DEFAULT NULL,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `ContactNo` varchar(30) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Unknown',
  `profilePicturePath` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`StudentNo`),
  UNIQUE KEY `rfidTag` (`rfidTag`),
  UNIQUE KEY `studentId` (`studentId`),
  KEY `idx_students_contact` (`ContactNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
