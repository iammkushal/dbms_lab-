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

CREATE TABLE EmployeeAudit (
    AuditID INT AUTO_INCREMENT PRIMARY KEY,
    EmpID INT,
    ActionType VARCHAR(20),
    OldSalary DECIMAL(10,2),
    NewSalary DECIMAL(10,2),
    ActionTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Departments (DeptID, DeptName) VALUES
(10, 'HR'),
(20, 'IT'),
(30, 'Finance');

INSERT INTO Employees (EmpID, Name, DeptID, Salary) VALUES
(1, 'Alice', 10, 55000.00),
(2, 'Bob', 20, 75000.00);


DELIMITER //
CREATE TRIGGER BeforeEmployeeInsert
BEFORE INSERT ON Employees
FOR EACH ROW
BEGIN
    IF NEW.Salary < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Salary cannot be negative.';
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER AfterEmployeeInsert
AFTER INSERT ON Employees
FOR EACH ROW
BEGIN
    INSERT INTO EmployeeAudit (EmpID, ActionType, OldSalary, NewSalary)
    VALUES (NEW.EmpID, 'INSERT', NULL, NEW.Salary);
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER BeforeEmployeeUpdate
BEFORE UPDATE ON Employees
FOR EACH ROW
BEGIN
    IF NEW.Salary < OLD.Salary THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Salary decreases are not permitted.';
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER AfterEmployeeUpdate
AFTER UPDATE ON Employees
FOR EACH ROW
BEGIN
    IF OLD.Salary <> NEW.Salary THEN
        INSERT INTO EmployeeAudit (EmpID, ActionType, OldSalary, NewSalary)
        VALUES (NEW.EmpID, 'UPDATE', OLD.Salary, NEW.Salary);
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER BeforeEmployeeDelete
BEFORE DELETE ON Employees
FOR EACH ROW
BEGIN
    IF OLD.Name = 'Alice' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Critical administrators cannot be deleted.';
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER AfterEmployeeDelete
AFTER DELETE ON Employees
FOR EACH ROW
BEGIN
    INSERT INTO EmployeeAudit (EmpID, ActionType, OldSalary, NewSalary)
    VALUES (OLD.EmpID, 'DELETE', OLD.Salary, NULL);
END //
DELIMITER ;


INSERT INTO Employees (EmpID, Name, DeptID, Salary) VALUES (3, 'Charlie', 20, 60000.00);

SELECT * FROM EmployeeAudit;

UPDATE Employees SET Salary = 65000.00 WHERE EmpID = 3;

SELECT * FROM EmployeeAudit;

DELETE FROM Employees WHERE EmpID = 3;

SELECT * FROM EmployeeAudit;
