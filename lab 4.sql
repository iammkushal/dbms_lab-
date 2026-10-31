DROP DATABASE IF EXISTS StoreDB;
CREATE DATABASE StoreDB;
USE StoreDB;

CREATE TABLE Sales (
    SaleID INT PRIMARY KEY,
    ItemName VARCHAR(50) NOT NULL,
    PriceString VARCHAR(20) NOT NULL, 
    SaleDate DATETIME NOT NULL
);

INSERT INTO Sales (SaleID, ItemName, PriceString, SaleDate) VALUES
(1, 'Laptop', '1250.50', '2026-10-01 14:30:00'),
(2, 'Mouse', '25.00', '2026-10-05 09:15:00'),
(3, 'Keyboard', '45.75', '2026-10-15 18:45:00');

SELECT 
    ItemName,
    PriceString,
    CAST(PriceString AS DECIMAL(10,2)) AS CastedPrice,
    CONVERT(PriceString, DECIMAL(10,2)) * 1.10 AS PriceWithTax
FROM Sales;

SELECT 
    ItemName,
    SaleDate,
    NOW() AS CurrentSystemTime,
    YEAR(SaleDate) AS SaleYear,
    MONTHNAME(SaleDate) AS SaleMonthName,
    DATE_FORMAT(SaleDate, '%W, %M %d, %Y') AS FormattedDate,
    DATE_ADD(SaleDate, INTERVAL 30 DAY) AS ReturnDeadline,
    DATEDIFF(NOW(), SaleDate) AS DaysSinceSale
FROM Sales;
