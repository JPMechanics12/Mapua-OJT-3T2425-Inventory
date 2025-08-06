-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Current Database: mapuainventory
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mapuainventory` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `mapuainventory`;

--
-- Dumping events for database 'mapuainventory'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;

-- begin event `mapuainventory`.`ev_retire_old_pcs`
/*!50106 DROP EVENT IF EXISTS `ev_retire_old_pcs` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE DEFINER=`root`@`localhost` EVENT IF NOT EXISTS `ev_retire_old_pcs` ON SCHEDULE EVERY 1 DAY STARTS '2025-07-30 19:54:27' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE `Computers` AS c
    JOIN `ComputerAssets` AS a
      ON a.RoomID=c.RoomID
    AND a.PCNumber=c.PCNumber
    SET c.Status='Retired'
    WHERE a.RetiredAt IS NULL
      AND a.InstalledAt <= DATE_SUB(CURDATE(), INTERVAL 5 YEAR) */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
-- end event `mapuainventory`.`ev_retire_old_pcs`

DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'mapuainventory'
--

