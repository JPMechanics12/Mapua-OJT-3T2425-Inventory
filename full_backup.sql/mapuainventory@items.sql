-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: items
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Table structure for table `items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `items` (
  `ItemID` int NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ItemCategory` enum('RJ45','Serial Cable','Keyboard','Mouse','PowerSupply','HDMI','Projector','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `MaxQuantity` int NOT NULL,
  `CurrentAvailable` int NOT NULL,
  PRIMARY KEY (`ItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
