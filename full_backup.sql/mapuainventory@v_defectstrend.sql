-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: v_defectstrend
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Final view structure for view `v_defectstrend`
--

/*!50001 DROP VIEW IF EXISTS `v_defectstrend`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_defectstrend` AS select `computerstatuslog`.`CheckDate` AS `d`,count(0) AS `defects` from `computerstatuslog` where (`computerstatuslog`.`Status` = 'Defective') group by `computerstatuslog`.`CheckDate` order by `computerstatuslog`.`CheckDate` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
