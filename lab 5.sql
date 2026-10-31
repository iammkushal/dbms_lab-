DROP DATABASE IF EXISTS InventoryDB;
CREATE DATABASE InventoryDB;
USE InventoryDB;

CREATE TABLE Products (
    ProductID INT PRIMARY KEY,
    ProductName VARCHAR(50) NOT NULL,
    Category VARCHAR(30) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    StockQuantity INT NOT NULL
);

INSERT INTO Products (ProductID, ProductName, Category, Price, StockQuantity) VALUES
(1, 'Laptop', 'Electronics', 1200.00, 15),
(2, 'Smartphone', 'Electronics', 800.00, 0),
(3, 'Desk Chair', 'Furniture', 150.00, 45),
(4, 'Coffee Maker', 'Appliances', 85.00, 12),
(5, 'Blender', 'Appliances', 45.00, 8),
(6, 'Dining Table', 'Furniture', 500.00, 3);

SELECT 
    ProductName,
    Price,
    StockQuantity,
    (Price * StockQuantity) AS TotalInventoryValue,
    (Price + 10.00) AS PriceWithShipping,
    (Price - (Price * 0.10)) AS DiscountedPrice,
    (StockQuantity % 2) AS IsStockOddOrEven
FROM Products;

SELECT ProductName, Price, StockQuantity
FROM Products
WHERE Price >= 150.00;

SELECT ProductName, Price
FROM Products
WHERE Price <> 800.00;

SELECT ProductName, Category, Price, StockQuantity
FROM Products
WHERE Category = 'Electronics' AND Price > 500.00;

SELECT ProductName, Category, Price
FROM Products
WHERE Category = 'Furniture' OR Price < 50.00;

SELECT ProductName, Price
FROM Products
WHERE Price BETWEEN 50.00 AND 200.00;

SELECT ProductName, Category
FROM Products
WHERE Category IN ('Electronics', 'Appliances');

SELECT ProductName
FROM Products
WHERE ProductName LIKE '%Chair%';

SELECT ProductName, StockQuantity
FROM Products
WHERE NOT StockQuantity = 0;
