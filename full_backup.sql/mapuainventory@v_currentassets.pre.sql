-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: v_currentassets
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Temporary view structure for view `v_currentassets`
--

DROP TABLE IF EXISTS `v_currentassets`;
/*!50001 DROP VIEW IF EXISTS `v_currentassets`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_currentassets` AS SELECT 
 1 AS `AssetID`,
 1 AS `RoomID`,
 1 AS `PCNumber`,
 1 AS `InstalledAt`,
 1 AS `RetiredAt`,
 1 AS `MakeModel`,
 1 AS `SerialNumber`,
 1 AS `CPU`,
 1 AS `GPU`,
 1 AS `RAM_GB`,
 1 AS `Storage_GB`,
 1 AS `MonitorModel`,
 1 AS `MonitorSerial`,
 1 AS `UPSModel`,
 1 AS `UPSSerial`,
 1 AS `CreatedBy`,
 1 AS `CreatedAt` */;
SET character_set_client = @saved_cs_client;
