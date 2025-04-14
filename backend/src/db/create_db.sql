-- Create the database if it doesn't exist
CREATE DATABASE fieldscore;

-- Create a user and grant privileges
CREATE USER fieldscore_user WITH PASSWORD 'fieldscore_password';
GRANT ALL PRIVILEGES ON DATABASE fieldscore TO fieldscore_user;
