import mysql.connector
import pandas as pd
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor
import os
import time

# =====================================================
# CONFIG
# =====================================================
STOCKS_FOLDER = "stocks"
CHUNK_SIZE = 100_000
WORKERS = 8
SUB_BATCH_SIZE = 1_000

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", ""),
    "password": os.getenv("DB_PASS", ""),
    "database": os.getenv("DB_NAME", "")
}

INSERT_QUERY = """
INSERT INTO stock_prices
(date, open_price, high_price, low_price, close_price, adj_close, volume, ticker)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

# =====================================================
# DB CONNECTION PER WORKER
# =====================================================
def new_connection():
    return mysql.connector.connect(**DB_CONFIG)

# =====================================================
# INSERT BATCH FUNCTION (PARALLEL)
# =====================================================
def insert_batch(data_batch):
    conn = new_connection()
    cur = conn.cursor()
    total = 0

    for i in range(0, len(data_batch), SUB_BATCH_SIZE):
        sub = data_batch[i:i+SUB_BATCH_SIZE]
        try:
            cur.executemany(INSERT_QUERY, sub)
            conn.commit()
            total += len(sub)
        except Exception as e:
            print(f"\n❌ Insert error: {e}")
            conn.rollback()

    cur.close()
    conn.close()
    return total

# =====================================================
# MAIN LOADER
# =====================================================
def load_all_stock_files():
    stock_files = [
        os.path.join(STOCKS_FOLDER, f)
        for f in os.listdir(STOCKS_FOLDER)
        if f.lower().endswith(".csv")
    ]

    print(f"\n📁 STOCK FILES FOUND: {len(stock_files):,}")
    for f in stock_files[:10]:
        print("  -", os.path.basename(f))
    print("...")

    total_inserted = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = []

        for csv_path in stock_files:
            print(f"\n📥 Loading {csv_path}")

            total_rows = sum(1 for _ in open(csv_path)) - 1
            total_chunks = total_rows // CHUNK_SIZE + 1

            for chunk in tqdm(pd.read_csv(csv_path, chunksize=CHUNK_SIZE), total=total_chunks):
                chunk = chunk.fillna({
                    "Open": 0, "High": 0, "Low": 0,
                    "Close": 0, "Adj Close": 0, "Volume": 0
                })

                ticker = os.path.basename(csv_path).replace(".csv", "")
                data = [
                    (
                        row["Date"],
                        float(row["Open"]),
                        float(row["High"]),
                        float(row["Low"]),
                        float(row["Close"]),
                        float(row["Adj Close"]),
                        int(row["Volume"]),
                        ticker
                    )
                    for _, row in chunk.iterrows()
                ]

                futures.append(executor.submit(insert_batch, data))

        for f in tqdm(futures, desc="📤 Inserting into MySQL"):
            total_inserted += f.result()

    end_time = time.time()
    print("\n====================================")
    print(f"✔ COMPLETED: Inserted {total_inserted:,} rows")
    print(f"⏱ Time: {(end_time - start_time)/60:.2f} minutes")
    print("====================================\n")


if __name__ == "__main__":
    load_all_stock_files()
