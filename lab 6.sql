DROP DATABASE IF EXISTS CompanyDB;
CREATE DATABASE CompanyDB;
USE CompanyDB;

CREATE TABLE ActiveEmployees (
    EmpID INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Role VARCHAR(30) NOT NULL,
    Salary DECIMAL(10,2),
    Region VARCHAR(20)
);

CREATE TABLE ContractStaff (
    StaffID INT PRIMARY KEY,
    FullName VARCHAR(50) NOT NULL,
    JobTitle VARCHAR(30) NOT NULL,
    HourlyRate DECIMAL(10,2),
    Region VARCHAR(20)
);

INSERT INTO ActiveEmployees (EmpID, Name, Role, Salary, Region) VALUES
(1, 'Alice Smith', 'Manager', 95000.00, 'North'),
(2, 'Bob Jones', 'Developer', 80000.00, 'West'),
(3, 'Charlie Brown', 'Analyst', 60000.00, NULL),
(4, 'David Miller', 'Developer', 75000.00, 'North');

INSERT INTO ContractStaff (StaffID, FullName, JobTitle, HourlyRate, Region) VALUES
(101, 'Eva Green', 'Designer', 55.00, 'East'),
(102, 'Bob Jones', 'Developer', 65.00, 'West'),
(103, 'Frank Wright', 'Consultant', 85.00, 'North');

SELECT Name, Salary 
FROM ActiveEmployees 
WHERE Salary BETWEEN 70000.00 AND 100000.00;

SELECT Name, Role 
FROM ActiveEmployees 
WHERE Role IN ('Manager', 'Analyst');

SELECT Name 
FROM ActiveEmployees 
WHERE Name LIKE '%Smith%';

SELECT Name 
FROM ActiveEmployees 
WHERE Region IS NULL;

SELECT Name, Role, Region FROM ActiveEmployees
UNION
SELECT FullName, JobTitle, Region FROM ContractStaff;

SELECT Name, Role, Region FROM ActiveEmployees
UNION ALL
SELECT FullName, JobTitle, Region FROM ContractStaff;
