-- Update database name to match your own
use your_database_name;

CREATE TABLE image_shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    R INT NOT NULL,
    G INT NOT NULL,
    B INT NOT NULL,
    T VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS stock_prices;
CREATE TABLE stock_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    open_price DOUBLE,
    high_price DOUBLE,
    low_price DOUBLE,
    close_price DOUBLE,
    adj_close DOUBLE,
    volume BIGINT,
    ticker VARCHAR(12)
);

DROP TABLE IF EXISTS mart_monthly_avg;
CREATE TABLE mart_monthly_avg (
    ticker VARCHAR(12),
    yr INT,
    mn INT,
    avg_close DOUBLE
);

INSERT INTO mart_monthly_avg (ticker, yr, mn, avg_close)
SELECT ticker,
       YEAR(date) AS yr,
       MONTH(date) AS mn,
       AVG(close_price)
FROM stock_prices
GROUP BY ticker, yr, mn;

DROP TABLE IF EXISTS mart_daily_corr;
CREATE TABLE mart_daily_corr (
    ticker VARCHAR(12),
    date DATE,
    close_price DOUBLE,
    volume BIGINT
);

INSERT INTO mart_daily_corr (ticker, date, close_price, volume)
SELECT 
    ticker,
    date,
    close_price,
    volume
FROM stock_prices
ORDER BY ticker, date;

DROP TABLE IF EXISTS web_users;
CREATE TABLE IF NOT EXISTS web_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
);

DROP TABLE IF EXISTS User_Setting;
CREATE TABLE User_Setting (
    uid INT PRIMARY KEY,
    login VARCHAR(50) NOT NULL,
    slider_low_value DOUBLE,
    slider_high_value DOUBLE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
