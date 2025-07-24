-- 创建数据库
CREATE DATABASE IF NOT EXISTS accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE accounting_app;

-- 创建用户（可选，如果需要专门的数据库用户）
-- CREATE USER 'accounting_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON accounting_app.* TO 'accounting_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 显示创建结果
SHOW DATABASES LIKE 'accounting_app';