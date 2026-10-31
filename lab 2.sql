DROP DATABASE IF EXISTS UniversityDB;
CREATE DATABASE UniversityDB;
USE UniversityDB;

CREATE TABLE Students (
    StudentID INT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100)
);

INSERT INTO Students (StudentID, FirstName, LastName, Email) VALUES
(1, 'John', 'Doe', 'john.doe@example.com'),
(2, 'Jane', 'Smith', 'jane.smith@example.com'),
(3, 'Alex', 'Jones', 'alex.jones@example.com');

UPDATE Students
SET Email = 'jane.jones@example.com'
WHERE StudentID = 2;

DELETE FROM Students
WHERE StudentID = 3;

SELECT * FROM Students;
