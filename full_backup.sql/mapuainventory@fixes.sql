-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: fixes
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `fixes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `fixes` (
  `FixID` int unsigned NOT NULL AUTO_INCREMENT,
  `RoomID` varchar(10) NOT NULL,
  `PCNumber` char(2) NOT NULL,
  `FixedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `FixedBy` int unsigned DEFAULT NULL,
  `ServiceTicketID` varchar(100) NOT NULL,
  PRIMARY KEY (`FixID`),
  UNIQUE KEY `uk_fix_ticket` (`ServiceTicketID`),
  KEY `RoomID` (`RoomID`,`PCNumber`),
  KEY `FixedBy` (`FixedBy`),
  CONSTRAINT `fixes_ibfk_1` FOREIGN KEY (`RoomID`, `PCNumber`) REFERENCES `computers` (`RoomID`, `PCNumber`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fixes_ibfk_2` FOREIGN KEY (`FixedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fixes_ibfk_3` FOREIGN KEY (`ServiceTicketID`) REFERENCES `computerstatuslog` (`ServiceTicketID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=294 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
