-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: computerassets
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `computerassets`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `computerassets` (
  `AssetID` int unsigned NOT NULL AUTO_INCREMENT,
  `RoomID` varchar(10) NOT NULL,
  `PCNumber` char(2) NOT NULL,
  `InstalledAt` date NOT NULL,
  `RetiredAt` date DEFAULT NULL,
  `MakeModel` varchar(100) NOT NULL,
  `SerialNumber` varchar(100) NOT NULL,
  `CPU` varchar(100) DEFAULT NULL,
  `GPU` varchar(100) DEFAULT NULL,
  `RAM_GB` smallint DEFAULT NULL,
  `Storage_GB` smallint DEFAULT NULL,
  `MonitorModel` varchar(100) DEFAULT NULL,
  `MonitorSerial` varchar(100) DEFAULT NULL,
  `UPSModel` varchar(100) DEFAULT NULL,
  `UPSSerial` varchar(100) DEFAULT NULL,
  `CreatedBy` int unsigned DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AssetID`),
  UNIQUE KEY `uk_active_asset` (`RoomID`,`PCNumber`,`RetiredAt`),
  KEY `CreatedBy` (`CreatedBy`),
  CONSTRAINT `computerassets_ibfk_1` FOREIGN KEY (`RoomID`, `PCNumber`) REFERENCES `computers` (`RoomID`, `PCNumber`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `computerassets_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
