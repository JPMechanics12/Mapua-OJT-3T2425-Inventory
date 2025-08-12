  /*───────────────────────────────────────────────────────────────
    MapuaInventory – schema-only setup script  (FIXED 2025-07-07)
    Requirements : MySQL 8.0+
  ────────────────────────────────────────────────────────────────*/

  /*----------------------------------------------------------------
    0)  Drop + recreate the database
  ----------------------------------------------------------------*/
  DROP DATABASE IF EXISTS `MapuaInventory`;
  CREATE DATABASE `MapuaInventory`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
  USE `MapuaInventory`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mapuainventory
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `borroweditems`
--

DROP TABLE IF EXISTS `borroweditems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borroweditems` (
  `BorrowID` int unsigned NOT NULL AUTO_INCREMENT,
  `StudentNo` varchar(20) NOT NULL,
  `BorrowedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DueAt` datetime DEFAULT NULL,
  `ReturnedAt` datetime DEFAULT NULL,
  `Status` enum('Borrowed','Returned','Overdue') NOT NULL DEFAULT 'Borrowed',
  `ItemID` int NOT NULL,
  `Quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`BorrowID`),
  KEY `idx_borrow_status` (`Status`),
  KEY `idx_borrow_student` (`StudentNo`,`Status`),
  KEY `fk_borroweditem_item` (`ItemID`),
  CONSTRAINT `borroweditems_ibfk_1` FOREIGN KEY (`StudentNo`) REFERENCES `students` (`StudentNo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_borroweditem_item` FOREIGN KEY (`ItemID`) REFERENCES `items` (`ItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `computerassets`
--

DROP TABLE IF EXISTS `computerassets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `computerassets` (
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

--
--


--
-- Table structure for table `computers`
--

DROP TABLE IF EXISTS `computers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `computers` (
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

--
--


--
-- Table structure for table `computerstatuslog`
--

DROP TABLE IF EXISTS `computerstatuslog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `computerstatuslog` (
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

--
--

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_set_ticketid` BEFORE INSERT ON `computerstatuslog` FOR EACH ROW BEGIN
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
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_automate_fix` AFTER INSERT ON `computerstatuslog` FOR EACH ROW BEGIN
    IF NEW.Status = 'Working' THEN
      -- 6a) insert a fix record
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

--
-- Table structure for table `dailyticketseq`
--

DROP TABLE IF EXISTS `dailyticketseq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dailyticketseq` (
  `seq_date` date NOT NULL,
  `seq` int unsigned NOT NULL,
  PRIMARY KEY (`seq_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `fixes`
--

DROP TABLE IF EXISTS `fixes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixes` (
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

--
--


--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `ItemID` int NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ItemCategory` enum('RJ45','Serial Cable','Keyboard','Mouse','PowerSupply','HDMI','Projector','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `MaxQuantity` int NOT NULL,
  `CurrentAvailable` int NOT NULL,
  PRIMARY KEY (`ItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `RoomID` varchar(10) NOT NULL,
  `Room_Config` int NOT NULL DEFAULT '1',
  `PC_NUM` int NOT NULL DEFAULT '41',
  PRIMARY KEY (`RoomID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `StudentNo` varchar(20) NOT NULL,
  `rfidTag` varchar(255) DEFAULT NULL,
  `studentId` varchar(255) DEFAULT NULL,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `ContactNo` varchar(30) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Unknown',
  `profilePicturePath` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`StudentNo`),
  UNIQUE KEY `rfidTag` (`rfidTag`),
  UNIQUE KEY `studentId` (`studentId`),
  KEY `idx_students_contact` (`ContactNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int unsigned NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `ContactNo` varchar(30) DEFAULT NULL,
  `PasswordHash` varchar(255) DEFAULT NULL,
  `Role` enum('Admin','Viewer','Ticketing','Inventory') NOT NULL DEFAULT 'Inventory',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Color` varchar(255) DEFAULT 'Dark1',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `idx_users_role` (`Role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Final view structure for view `v_currentassets`
--
CREATE VIEW `v_currentassets` AS
SELECT `computerassets`.`AssetID` AS `AssetID`,
    `computerassets`.`RoomID` AS `RoomID`,
    `computerassets`.`PCNumber` AS `PCNumber`,
    `computerassets`.`InstalledAt` AS `InstalledAt`,
    `computerassets`.`RetiredAt` AS `RetiredAt`,
    `computerassets`.`MakeModel` AS `MakeModel`,
    `computerassets`.`SerialNumber` AS `SerialNumber`,
    `computerassets`.`CPU` AS `CPU`,
    `computerassets`.`GPU` AS `GPU`,
    `computerassets`.`RAM_GB` AS `RAM_GB`,
    `computerassets`.`Storage_GB` AS `Storage_GB`,
    `computerassets`.`MonitorModel` AS `MonitorModel`,
    `computerassets`.`MonitorSerial` AS `MonitorSerial`,
    `computerassets`.`UPSModel` AS `UPSModel`,
    `computerassets`.`UPSSerial` AS `UPSSerial`,
    `computerassets`.`CreatedBy` AS `CreatedBy`,
    `computerassets`.`CreatedAt` AS `CreatedAt`
FROM
    `computerassets`
WHERE
    `computerassets`.`RetiredAt` IS NULL;

--
-- Final view structure for view `v_defectstrend`
--
CREATE VIEW `v_defectstrend` AS
SELECT
    `computerstatuslog`.`CheckDate` AS `d`,
    COUNT(0) AS `c`
FROM
    `computerstatuslog`
WHERE
    `computerstatuslog`.`StatusID` = 3
GROUP BY
    `computerstatuslog`.`CheckDate`;
