-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: computerstatuslog
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `computerstatuslog`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `computerstatuslog` (
  `LogID` int unsigned NOT NULL AUTO_INCREMENT,
  `RoomID` varchar(10) NOT NULL,
  `PCNumber` char(2) NOT NULL,
  `CheckDate` date NOT NULL,
  `Status` enum('Working','Defective') NOT NULL DEFAULT 'Working',
  `Issues` varchar(255) DEFAULT NULL,
  `UserID` int unsigned DEFAULT NULL,
  `LoggedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ServiceTicketID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`LogID`),
  UNIQUE KEY `ServiceTicketID` (`ServiceTicketID`),
  KEY `RoomID` (`RoomID`,`PCNumber`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `computerstatuslog_ibfk_1` FOREIGN KEY (`RoomID`, `PCNumber`) REFERENCES `computers` (`RoomID`, `PCNumber`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `computerstatuslog_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
