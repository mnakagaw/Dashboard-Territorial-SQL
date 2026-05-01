CREATE DATABASE IF NOT EXISTS carapicha_dbt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'carapicha'@'%' IDENTIFIED BY 'one2026';
CREATE USER IF NOT EXISTS 'carapicha'@'localhost' IDENTIFIED BY 'one2026';
CREATE USER IF NOT EXISTS 'carapicha'@'127.0.0.1' IDENTIFIED BY 'one2026';
GRANT ALL PRIVILEGES ON carapicha_dbt.* TO 'carapicha'@'%';
GRANT ALL PRIVILEGES ON carapicha_dbt.* TO 'carapicha'@'localhost';
GRANT ALL PRIVILEGES ON carapicha_dbt.* TO 'carapicha'@'127.0.0.1';
FLUSH PRIVILEGES;
