DROP DATABASE IF EXISTS CompanyDB;
CREATE DATABASE CompanyDB;
USE CompanyDB;

CREATE TABLE Departments (
    DeptID INT PRIMARY KEY,
    DeptName VARCHAR(50) NOT NULL
);

CREATE TABLE Employees (
    EmpID INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    DeptID INT,
    Salary DECIMAL(10,2),
    FOREIGN KEY (DeptID) REFERENCES Departments(DeptID)
);

INSERT INTO Departments (DeptID, DeptName) VALUES
(10, 'HR'),
(20, 'IT'),
(30, 'Finance');

INSERT INTO Employees (EmpID, Name, DeptID, Salary) VALUES
(1, 'Alice', 10, 55000.00),
(2, 'Bob', 20, 75000.00),
(3, 'Charlie', NULL, 45000.00),
(4, 'David', 20, 80000.00),
(5, 'Eva', 10, 60000.00),
(6, 'Frank', 20, 72000.00);

SELECT e.EmpID, e.Name, d.DeptName
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID;

SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d ON e.DeptID = d.DeptID;

SELECT e.Name, d.DeptName
FROM Employees e
RIGHT JOIN Departments d ON e.DeptID = d.DeptID;

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

SELECT d.DeptName, COUNT(e.EmpID) AS TotalEmployees, AVG(e.Salary) AS AverageSalary
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID
GROUP BY d.DeptName;

SELECT d.DeptName, AVG(e.Salary) AS AverageSalary
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID
GROUP BY d.DeptName
HAVING AVG(e.Salary) > 60000.00;

SELECT Name, Salary
FROM Employees
ORDER BY Salary DESC;

SELECT d.DeptName, COUNT(e.EmpID) AS TotalEmployees
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID
GROUP BY d.DeptName
HAVING COUNT(e.EmpID) >= 2
ORDER BY TotalEmployees DESC;
