-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: computers
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `computers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `computers` (
  `RoomID` varchar(10) NOT NULL,
  `PCNumber` char(2) NOT NULL COMMENT '00–40 = students',
  `Status` enum('Working','Defective','Retired') NOT NULL DEFAULT 'Working',
  `LastUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastFixedAt` datetime DEFAULT NULL,
  `LastFixedBy` int unsigned DEFAULT NULL,
  PRIMARY KEY (`RoomID`,`PCNumber`),
  CONSTRAINT `computers_ibfk_1` FOREIGN KEY (`RoomID`) REFERENCES `room` (`RoomID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
