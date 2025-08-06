-- MySQLShell dump 2.0.1  Distrib Ver 8.0.43 for Win64 on x86_64 - for MySQL 8.0.43 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapuainventory    Table: computerstatuslog
-- ------------------------------------------------------
-- Server version	8.0.43

--
-- Dumping triggers for table 'mapuainventory'.'computerstatuslog'
--

-- begin trigger `mapuainventory`.`trg_set_ticketid`
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
/*!50032 DROP TRIGGER IF EXISTS `trg_set_ticketid` */;
DELIMITER ;;
/*!50003 CREATE DEFINER=`root`@`localhost` TRIGGER `trg_set_ticketid` BEFORE INSERT ON `computerstatuslog` FOR EACH ROW BEGIN
    IF NEW.ServiceTicketID IS NULL THEN
      -- base: ROOM-PC-firstIssueOrChecked
      SET @base = CONCAT(
        NEW.RoomID, '-',
        NEW.PCNumber, '-',
        IFNULL(NULLIF(SUBSTRING_INDEX(NEW.Issues, ',', 1), ''), 'Checked')
      );
      -- suffix: a compact UUID (hex only, no hyphens)
      SET NEW.ServiceTicketID = CONCAT(
        @base, '-',
        REPLACE(UUID(), '-', '')
      );
    END IF;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
-- end trigger `mapuainventory`.`trg_set_ticketid`

-- begin trigger `mapuainventory`.`trg_automate_fix`
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
/*!50032 DROP TRIGGER IF EXISTS `trg_automate_fix` */;
DELIMITER ;;
/*!50003 CREATE DEFINER=`root`@`localhost` TRIGGER `trg_automate_fix` AFTER INSERT ON `computerstatuslog` FOR EACH ROW BEGIN
    IF NEW.Status = 'Working' THEN
      -- 6a) insert a fix record
      INSERT INTO `Fixes`
        (RoomID, PCNumber, FixedAt, FixedBy, ServiceTicketID)
      VALUES
        (NEW.RoomID, NEW.PCNumber, NEW.LoggedAt, NEW.UserID, NEW.ServiceTicketID);

      -- 6b) update the master Computers table
      UPDATE `Computers`
        SET `Status`      = 'Working',
            `LastFixedAt` = NEW.LoggedAt,
            `LastFixedBy` = NEW.UserID,
            `LastUpdated` = NEW.LoggedAt
      WHERE RoomID   = NEW.RoomID
        AND PCNumber = NEW.PCNumber;
    ELSE
      -- defective => mark machine down
      UPDATE `Computers`
        SET `Status`      = 'Defective',
            `LastUpdated` = NEW.LoggedAt
      WHERE RoomID   = NEW.RoomID
        AND PCNumber = NEW.PCNumber;
    END IF;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
-- end trigger `mapuainventory`.`trg_automate_fix`

