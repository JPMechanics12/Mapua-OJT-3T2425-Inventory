-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: v_currentassets
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Final view structure for view `v_currentassets`
--

/*!50001 DROP VIEW IF EXISTS `v_currentassets`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_currentassets` AS select `computerassets`.`AssetID` AS `AssetID`,`computerassets`.`RoomID` AS `RoomID`,`computerassets`.`PCNumber` AS `PCNumber`,`computerassets`.`InstalledAt` AS `InstalledAt`,`computerassets`.`RetiredAt` AS `RetiredAt`,`computerassets`.`MakeModel` AS `MakeModel`,`computerassets`.`SerialNumber` AS `SerialNumber`,`computerassets`.`CPU` AS `CPU`,`computerassets`.`GPU` AS `GPU`,`computerassets`.`RAM_GB` AS `RAM_GB`,`computerassets`.`Storage_GB` AS `Storage_GB`,`computerassets`.`MonitorModel` AS `MonitorModel`,`computerassets`.`MonitorSerial` AS `MonitorSerial`,`computerassets`.`UPSModel` AS `UPSModel`,`computerassets`.`UPSSerial` AS `UPSSerial`,`computerassets`.`CreatedBy` AS `CreatedBy`,`computerassets`.`CreatedAt` AS `CreatedAt` from `computerassets` where (`computerassets`.`RetiredAt` is null) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
