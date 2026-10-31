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
(3, 'Charlie', NULL, 45000.00);


DELIMITER //
CREATE PROCEDURE GetAllEmployees()
BEGIN
    SELECT e.EmpID, e.Name, d.DeptName, e.Salary 
    FROM Employees e
    LEFT JOIN Departments d ON e.DeptID = d.DeptID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE InsertEmployee(
    IN p_EmpID INT,
    IN p_Name VARCHAR(50),
    IN p_DeptID INT,
    IN p_Salary DECIMAL(10,2)
)
BEGIN
    INSERT INTO Employees (EmpID, Name, DeptID, Salary)
    VALUES (p_EmpID, p_Name, p_DeptID, p_Salary);
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE UpdateEmployeeSalary(
    IN p_EmpID INT,
    IN p_NewSalary DECIMAL(10,2)
)
BEGIN
    UPDATE Employees 
    SET Salary = p_NewSalary 
    WHERE EmpID = p_EmpID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE DeleteEmployee(
    IN p_EmpID INT)
BEGIN
    DELETE FROM Employees 
    WHERE EmpID = p_EmpID;
END //
DELIMITER ;


CALL GetAllEmployees();

CALL InsertEmployee(4, 'David', 20, 80000.00);

CALL GetAllEmployees();

CALL UpdateEmployeeSalary(1, 62000.00);

CALL GetAllEmployees();

CALL DeleteEmployee(3);

CALL GetAllEmployees();
