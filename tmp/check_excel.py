import pandas as pd
import os

try:
    df = pd.read_excel('dataset/ODIR-5K/ODIR-5K/data.xlsx')
    print("Columns:", df.columns.tolist())
    print("Head:\n", df.head())
    df.to_csv('dataset/labels.csv', index=False)
    print("Saved labels to dataset/labels.csv")
except Exception as e:
    print(f"Error: {e}")
