# Stock Market Dashboard

A full-stack web dashboard for exploring historical stock market data, 
built with PHP, MySQL, JavaScript, and Google Charts. Features 
session-based authentication, interactive filtering, outlier detection, 
and a parallel Python ETL pipeline for bulk data ingestion.

**Course:** CPS 5745 — Data Mining, Fall 2025  
**Author:** Dahana Moz Ruiz — Kean University

---

## Features

### Dashboard
- **Monthly Average Close Price** — Column chart of average closing 
  price per month, filterable by ticker and price range via dual sliders
- **Weekly Close Price vs Volume** — Dual-axis line chart comparing 
  weekly close price and trading volume over time
- **Ticker Dropdown** — Switch between individual stocks or view all
- **Price Range Sliders** — Filter the monthly chart by low/high close 
  price with real-time chart updates
- **Persistent Settings** — Save slider preferences per user session 
  to the database via AJAX

### Data Tables
- **Monthly Data Table** — Paginated Google Charts table with IQR-based 
  outlier highlighting (yellow rows)
- **Weekly Data Table** — Same outlier detection applied to volume data
- **Tab Navigation** — Switch between monthly and weekly data views

### Authentication
- Session-based login/logout with PHP
- Protected dashboard routes — unauthenticated users redirected to login
- Per-user settings stored and retrieved from MySQL

### ETL Pipeline (`merge.py`)
- Bulk loads stock CSV files into MySQL using **multithreaded parallel 
  insertion** (8 workers, 100k row chunks, 1k row sub-batches)
- Handles multiple tickers from a `stocks/` folder automatically
- Progress bars via `tqdm` for real-time insertion tracking

---

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript
- Google Charts API (ColumnChart, LineChart, Table)
- Fetch API for AJAX data loading

**Backend:**
- PHP — session management, routing, data API endpoints
- MySQL — stock price storage, data marts, user settings

**Data Pipeline:**
- Python — bulk CSV ingestion
- `mysql-connector-python` — database connection
- `pandas` — CSV parsing and chunking
- `ThreadPoolExecutor` — parallel insertion
- `tqdm` — progress tracking

---

## Dataset

**Source:** [Stock Market Dataset — Kaggle](https://www.kaggle.com/datasets/jacksoncrow/stock-market-dataset/data)  
**Author:** Jackson Crow  

Contains historical daily OHLCV (Open, High, Low, Close, Adjusted Close, 
Volume) data for thousands of stock tickers. The `merge.py` ETL pipeline 
loads these CSV files in bulk into MySQL using parallel multithreaded 
insertion.

> Dataset not included in this repository. Download directly from Kaggle 
> and place CSV files in the `stocks/` folder before running `merge.py`.

---

## Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `stock_prices` | Raw daily OHLCV data per ticker |
| `mart_monthly_avg` | Precomputed monthly average close per ticker |
| `mart_daily_corr` | Daily close price and volume for correlation chart |
| `web_users` | Dashboard login credentials |
| `User_Setting` | Per-user slider preferences |

### Data Marts
Two precomputed mart tables power the dashboard charts, avoiding 
expensive real-time aggregation on the full `stock_prices` table.

---

## File Structure

| File | Description |
|------|-------------|
| `index.php` | Main dashboard — protected, renders charts and tables |
| `login.html` | Login form UI |
| `login.php` | Authentication endpoint — validates credentials, sets session |
| `logout.php` | Destroys session and redirects to login |
| `dbconfig.php` | Database connection (credentials via environment variables) |
| `charts.js` | All chart rendering, slider logic, AJAX calls, outlier detection |
| `styles.css` | Full dashboard styling — dark sidebar, white chart panels |
| `get_tickers.php` | Returns distinct ticker list for dropdown |
| `get_monthly_chart.php` | Returns monthly avg close data filtered by ticker |
| `get_corr_chart.php` | Returns weekly close/volume data with IQR outlier flags |
| `get_settings.php` | Retrieves saved slider settings for current user |
| `save_settings.php` | Persists slider settings to database |
| `merge.py` | Parallel ETL pipeline — bulk loads stock CSVs into MySQL |
| `proj_queries.sql` | Full SQL schema — table creation and mart population |

---

## Setup

### Requirements
- PHP 8.x with MySQLi
- MySQL 8.x
- Python 3.x

### 1. Configure environment variables
Create a `.env` file (never commit this):

DB_HOST=your_host

DB_USER=your_username

DB_PASS=your_password

DB_NAME=your_database

### 2. Run the SQL schema
```sql
source proj_queries.sql
```

### 3. Download the dataset
Download the stock market dataset from Kaggle:  
[Stock Market Dataset — Kaggle](https://www.kaggle.com/datasets/jacksoncrow/stock-market-dataset/data)

Extract the CSV files and place them in a `stocks/` folder in the 
project root. Each file should be named by ticker symbol (e.g. `AAPL.csv`) 
with columns: `Date, Open, High, Low, Close, Adj Close, Volume`.

```bash
pip install mysql-connector-python pandas tqdm
python merge.py
```

### 4. Run the dashboard
Place files on a PHP server (e.g. XAMPP, MAMP, or Apache) and 
navigate to `index.php`.

---

## Outlier Detection

Both data tables use **IQR-based outlier detection**:
- Q1 and Q3 computed from the dataset
- Bounds: `Q1 - 1.5 × IQR` and `Q3 + 1.5 × IQR`
- Rows outside bounds are highlighted yellow in the table

For the monthly table, outliers are detected on closing price.  
For the weekly table, outliers are detected on trading volume.

---

## Known Limitations
- No CSRF protection on form submissions
- Settings are tied to a shared user table from an external database

---

## Author

Dahana Moz Ruiz — Kean University, Fall 2025
