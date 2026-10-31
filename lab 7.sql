CREATE DATABASE IF NOT EXISTS CompanyDB;
USE CompanyDB;

CREATE TABLE Departments (
    DeptID INT PRIMARY KEY,
    DeptName VARCHAR(50) NOT NULL
);

CREATE TABLE Employees (
    EmpID INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    DeptID INT,
    FOREIGN KEY (DeptID) REFERENCES Departments(DeptID)
);

INSERT INTO Departments (DeptID, DeptName) VALUES
(10, 'HR'),
(20, 'IT'),
(30, 'Finance');

INSERT INTO Employees (EmpID, Name, DeptID) VALUES
(1, 'Alice', 10),
(2, 'Bob', 20),
(3, 'Charlie', NULL);

SELECT e.EmpID, e.Name, d.DeptName
FROM Employees e
INNER JOIN Departments d 
    ON e.DeptID = d.DeptID;

SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d 
    ON e.DeptID = d.DeptID;

SELECT e.Name, d.DeptName
FROM Employees e
RIGHT JOIN Departments d 
    ON e.DeptID = d.DeptID;

SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d ON e.DeptID = d.DeptID
UNION
SELECT e.Name, d.DeptName
FROM Employees e
RIGHT JOIN Departments d ON e.DeptID = d.DeptID;

SELECT * 
FROM Employees
NATURAL JOIN Departments;
