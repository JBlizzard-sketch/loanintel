#!/usr/bin/env python3
"""
generate_kechita_dataset.py
Generates a realistic Kechita Microfinance Group dataset with:
- regions.csv
- branches.csv (100)
- officers.csv
- customers.csv (~120k configurable)
- loans.csv (~150k configurable)
- repayments.csv (sampled)
- daily_branch_performance.csv (365*100)
- fraud_signals.csv
- ai_customer_features.csv
- monthly_branch_summary.csv
- package zip: kechita_profile_dataset.zip

CONFIGURE: NUM_CUSTOMERS, NUM_LOANS, START_DATE, END_DATE, REPAY_SAMPLING_FRACTION
Run: python3 generate_kechita_dataset.py
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import zipfile

# -------- CONFIG --------
OUT_DIR = "kechita_profile_dataset"
NUM_CUSTOMERS = 120_000     # change if you need smaller dataset
NUM_LOANS = 150_000         # change as wanted
REPAY_SAMPLE_FRAC = 0.40    # fraction of loans to simulate daily repayments for
START_DATE = datetime(2024,11,1)
END_DATE = datetime(2025,10,31)
SEED = 42
# ------------------------

random.seed(SEED)
np.random.seed(SEED)

os.makedirs(OUT_DIR, exist_ok=True)

# Regions & branches
REGIONS = ["Nairobi","Coast","Eastern","Central","RiftValleyNorth","RiftValleySouth","Western","Nyanza"]
NUM_BRANCHES = 100
branch_ids = [f"BR{str(i+1).zfill(3)}" for i in range(NUM_BRANCHES)]
branch_names = [f"{random.choice(['Kechita','K-Micro','Unity','Haraka','Soko'])} {random.choice(['Market','Plaza','Centre','Hub','Branch'])} {i+1}" for i in range(NUM_BRANCHES)]
branch_region = np.random.choice(REGIONS, size=NUM_BRANCHES, p=[0.18,0.12,0.22,0.12,0.08,0.08,0.12,0.08])
urban_rural = np.random.choice(["Urban","Rural","Peri-Urban"], size=NUM_BRANCHES, p=[0.6,0.3,0.1])
staff_count = np.random.randint(6,25,size=NUM_BRANCHES)
avg_monthly_target_tier = np.random.choice(["A","B","C"], size=NUM_BRANCHES, p=[0.35,0.4,0.25])
branch_lat = np.random.uniform(-1.5, -4.5, NUM_BRANCHES)
branch_lon = np.random.uniform(36.5, 39.0, NUM_BRANCHES)

branches = pd.DataFrame({
    "branch_id": branch_ids,
    "branch_name": branch_names,
    "region": branch_region,
    "urban_rural": urban_rural,
    "staff_count": staff_count,
    "avg_target_tier": avg_monthly_target_tier,
    "latitude": branch_lat,
    "longitude": branch_lon
})
branches.to_csv(os.path.join(OUT_DIR, "branches.csv"), index=False)

# Regions file
pd.DataFrame({"region": REGIONS}).to_csv(os.path.join(OUT_DIR, "regions.csv"), index=False)

# Officers per branch
officer_records = []
officer_id = 1
branch_officer_map = {}
for b in branch_ids:
    num_officers = random.randint(4,12)
    ids = []
    for i in range(num_officers):
        oid = f"OF{str(officer_id).zfill(6)}"
        name = f"{random.choice(['John','James','Grace','Mercy','David','Peter','Esther','Paul','Mary','Susan','Kevin','Anne','Halima','Musa','Aisha'])} {random.choice(['Mwangi','Wanjiru','Kamau','Otieno','Njoroge','Kibet','Mutiso','Owino','Achieng','Maina'])}"
        officer_records.append({"officer_id": oid, "name": name, "branch_id": b, "role":"LoanOfficer"})
        ids.append(oid)
        officer_id += 1
    branch_officer_map[b] = ids
officers = pd.DataFrame(officer_records)
officers.to_csv(os.path.join(OUT_DIR, "officers.csv"), index=False)

# Customers
num_customers = NUM_CUSTOMERS
birth_years = np.random.randint(1970, 2003, num_customers)
first_names_m = ["John","James","Peter","Paul","Kevin","David","Daniel","Michael","Joseph","Mark","Eric","Samuel","Patrick","Fred","Alex","George"]
first_names_f = ["Mary","Mercy","Grace","Esther","Susan","Anne","Angela","Beatrice","Catherine","Wanjiru","Achieng","Joy","Faith","Ruth","Alice","Halima","Aisha"]
last_names = ["Mwangi","Wanjiru","Kamau","Otieno","Ouma","Njoroge","Kiprono","Kibet","Mutiso","Owino","Achoka","Maina","Chepkemoi","Ochieng","Oloo","Abdi","Mwende"]

genders = np.random.choice(["M","F"], size=num_customers, p=[0.46,0.54])
first_names = [random.choice(first_names_m) if g=="M" else random.choice(first_names_f) for g in genders]
lasts = [random.choice(last_names) for _ in range(num_customers)]
ages = 2025 - birth_years

def gen_kenya_id(year, idx):
    if 1996 <= year <= 1998:
        prefix = "32"
    elif 1990 <= year <= 1995:
        prefix = "31"
    elif year >= 1999:
        prefix = "33"
    elif year < 1990:
        prefix = "30"
    else:
        prefix = "34"
    return prefix + str(100000 + (idx % 900000))

national_ids = [gen_kenya_id(y,i) for i,y in enumerate(birth_years)]
region_choice = np.random.choice(REGIONS, size=num_customers, p=[0.18,0.12,0.22,0.12,0.08,0.08,0.12,0.08])
branch_by_region = {r: list(branches[branches.region==r].branch_id) for r in REGIONS}
primary_branches = [random.choice(branch_by_region[r]) if len(branch_by_region[r])>0 else random.choice(branch_ids) for r in region_choice]
business_types = np.random.choice(["MamaMboga","GroceryShop","Salon","BodaBoda","GeneralShop","Kiosk","WholesaleVendor","Tailor","Barber","MobileShop","Mitumba","ChaiVendor"], size=num_customers, p=[0.18,0.18,0.08,0.12,0.15,0.06,0.05,0.03,0.03,0.06,0.02,0.02])
income_band = np.random.choice(["<20k","20-50k","50-100k",">100k"], size=num_customers, p=[0.35,0.45,0.15,0.05])
historical_cycles = np.random.poisson(3, size=num_customers)
avg_weekly_cash = np.random.randint(1500,20000, size=num_customers)
fraud_flag_initial = np.random.choice([0,1], size=num_customers, p=[0.995,0.005])
phone_prefixes = ["072","073","074","071","070","079"]
phones = [random.choice(phone_prefixes) + str(np.random.randint(1000000,9999999)) for _ in range(num_customers)]

customers = pd.DataFrame({
    "customer_id": [f"C{str(i+1).zfill(7)}" for i in range(num_customers)],
    "first_name": first_names,
    "last_name": lasts,
    "gender": genders,
    "birth_year": birth_years,
    "age": ages,
    "national_id": national_ids,
    "phone": phones,
    "primary_branch": primary_branches,
    "region": region_choice,
    "business_type": business_types,
    "monthly_income_band": income_band,
    "historical_cycles": historical_cycles,
    "avg_weekly_cash": avg_weekly_cash,
    "fraud_flag_initial": fraud_flag_initial
})
customers.to_csv(os.path.join(OUT_DIR, "customers.csv"), index=False)

# Loans
start_date = START_DATE
end_date = END_DATE
days = (end_date - start_date).days + 1
all_dates = [start_date + timedelta(days=i) for i in range(days)]

target_loans = NUM_LOANS
cust_choices_idx = np.random.randint(0, num_customers, size=target_loans)
loan_disb_dates = np.random.choice(all_dates, size=target_loans)
loan_amounts = np.random.choice([5000,8000,10000,15000,20000,30000,40000,50000,60000], size=target_loans, p=[0.14,0.11,0.12,0.14,0.15,0.12,0.08,0.08,0.06])
tenor_weeks = np.random.choice([4,6], size=target_loans, p=[0.65,0.35])
due_dates = [ (loan_disb_dates[i] + timedelta(days=int(tenor_weeks[i]*7))).strftime("%Y-%m-%d") for i in range(target_loans) ]
officer_list = [random.choice(branch_officer_map[customers.iloc[cust_choices_idx[i]].primary_branch]) for i in range(target_loans)]
loan_ids = [f"L{str(i+1).zfill(8)}" for i in range(target_loans)]
daily_inst = np.round(loan_amounts / (tenor_weeks*7),2)
cust_ids_for_loans = customers.customer_id.values[cust_choices_idx]
branch_ids_for_loans = customers.primary_branch.values[cust_choices_idx]
fraud_flags_for_loans = customers.fraud_flag_initial.values[cust_choices_idx]

miss_rate_base = 0.03 + (fraud_flags_for_loans * 0.12) + np.where(customers.monthly_income_band.values[cust_choices_idx]=="<20k", 0.03, 0)
miss_rate = np.clip(miss_rate_base + np.random.normal(0,0.02,size=target_loans), 0, 0.6)
rescheduled = np.random.choice([0,1], size=target_loans, p=[0.985,0.015])
default_flag = np.random.choice([0,1], size=target_loans, p=[0.98,0.02])
loan_status = np.where(default_flag==1, "Defaulted", "Active")

loans = pd.DataFrame({
    "loan_id": loan_ids,
    "customer_id": cust_ids_for_loans,
    "branch_id": branch_ids_for_loans,
    "officer_id": officer_list,
    "disbursement_date": [d.strftime("%Y-%m-%d") for d in loan_disb_dates],
    "due_date": due_dates,
    "amount": loan_amounts,
    "tenor_weeks": tenor_weeks,
    "daily_installment": daily_inst,
    "miss_rate": miss_rate,
    "rescheduled": rescheduled,
    "default_flag": default_flag,
    "loan_status": loan_status
})
loans.to_csv(os.path.join(OUT_DIR, "loans.csv"), index=False)

# Repayments (sampled)
sample_loans = loans.sample(frac=REPAY_SAMPLE_FRAC, random_state=2)
repay_records = []
for _, loan in sample_loans.iterrows():
    disb = datetime.strptime(loan.disbursement_date, "%Y-%m-%d")
    due = datetime.strptime(loan.due_date, "%Y-%m-%d")
    days_len = (due - disb).days
    for d in range(days_len):
        pay_date = disb + timedelta(days=d)
        if pay_date < start_date or pay_date > end_date:
            continue
        if np.random.rand() > loan.miss_rate:
            amount_paid = float(max(0, round(np.random.normal(loan.daily_installment, 8),2)))
            repay_records.append((loan.loan_id, loan.customer_id, loan.branch_id, pay_date.strftime("%Y-%m-%d"), amount_paid, "Paid"))
        else:
            repay_records.append((loan.loan_id, loan.customer_id, loan.branch_id, pay_date.strftime("%Y-%m-%d"), 0.0, "Missed"))
repayments = pd.DataFrame(repay_records, columns=["loan_id","customer_id","branch_id","payment_date","amount_paid","status"])
repayments.to_csv(os.path.join(OUT_DIR, "repayments.csv"), index=False)

# Daily branch performance
dates_str = [d.strftime("%Y-%m-%d") for d in all_dates]
rows = []
for i,b in enumerate(branch_ids):
    tier = branches.loc[i, "avg_target_tier"]
    if tier=="A":
        base_recruit = 6
        base_disb = 12
        target = 1800000
    elif tier=="B":
        base_recruit = 4
        base_disb = 8
        target = 1100000
    else:
        base_recruit = 2
        base_disb = 4
        target = 650000
    doms = np.array([int(d.split("-")[2]) for d in dates_str])
    month_weight = 1.0 + (0.45 * (doms/28))
    recruits = np.maximum(0, np.random.poisson(base_recruit, size=len(dates_str)) * np.ceil(month_weight))
    disb_mean = np.random.poisson(base_disb, size=len(dates_str)) * month_weight
    disb_amounts = (disb_mean * np.random.choice([800,1000,1200], size=len(dates_str))).astype(int)
    daily_dues = (target/30 * np.random.uniform(0.8,1.2,size=len(dates_str))).astype(int)
    collected = (daily_dues * np.random.uniform(0.65,1.05,size=len(dates_str))).astype(int)
    missed_calls = np.random.poisson(2, size=len(dates_str))
    arrears_new = np.random.poisson(1, size=len(dates_str))
    par_percent = np.round(np.random.uniform(0.5,6.0,size=len(dates_str)),2)
    for j, d in enumerate(dates_str):
        rows.append((d, b, branches.loc[i,"region"], int(recruits[j]), int(disb_amounts[j]), int(daily_dues[j]), int(collected[j]), int(missed_calls[j]), int(arrears_new[j]), float(par_percent[j]), int(target)))
daily_branch_performance = pd.DataFrame(rows, columns=["date","branch_id","region","recruited_today","disbursed_amount_ksh","daily_dues_ksh","collected_ksh","missed_calls","arrears_new_ksh","par_percent","daily_target_ksh"])
daily_branch_performance.to_csv(os.path.join(OUT_DIR, "daily_branch_performance.csv"), index=False)

# Fraud signals sample
fraud_sample = customers.sample(frac=0.05, random_state=3)
fraud_signals = fraud_sample.assign(
    national_id_mismatch = np.random.choice([0,1], size=len(fraud_sample), p=[0.95,0.05]),
    shared_phone_number = np.random.choice([0,1], size=len(fraud_sample), p=[0.97,0.03]),
    distance_anomaly = np.random.choice([0,1], size=len(fraud_sample), p=[0.92,0.08]),
    suspicious_repayment_pattern = np.random.choice([0,1], size=len(fraud_sample), p=[0.9,0.1]),
    synthetic_customer_score = np.round(np.random.uniform(0,1,size=len(fraud_sample)),3)
)[["customer_id","national_id_mismatch","shared_phone_number","distance_anomaly","suspicious_repayment_pattern","synthetic_customer_score"]]
fraud_signals.to_csv(os.path.join(OUT_DIR, "fraud_signals.csv"), index=False)

# AI-ready customer features
sample_customers = customers.sample(frac=0.6, random_state=4)
ai_ready = sample_customers.assign(
    risk_score_0_100 = np.round(np.random.beta(2,5,size=len(sample_customers))*100,2),
    default_prob = np.round(np.clip(np.random.beta(1.5,6,size=len(sample_customers)) + (sample_customers.fraud_flag_initial*0.01), 0, 0.95),3),
    churn_prob = np.round(np.random.beta(2,4,size=len(sample_customers)),3),
    recommended_limit_ksh = (sample_customers.avg_weekly_cash * np.random.uniform(2,5,size=len(sample_customers))).astype(int).clip(5000,60000)
)[["customer_id","primary_branch","avg_weekly_cash","historical_cycles","risk_score_0_100","default_prob","churn_prob","recommended_limit_ksh"]]
ai_ready.to_csv(os.path.join(OUT_DIR, "ai_customer_features.csv"), index=False)

# Monthly summary
df = daily_branch_performance.copy()
df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
monthly_summary = df.groupby(['branch_id','month']).agg({
    'recruited_today':'sum',
    'disbursed_amount_ksh':'sum',
    'daily_dues_ksh':'sum',
    'collected_ksh':'sum',
    'arrears_new_ksh':'sum',
    'par_percent':'mean'
}).reset_index().rename(columns={
    'recruited_today':'recruited_monthly',
    'disbursed_amount_ksh':'disbursed_monthly_ksh',
    'daily_dues_ksh':'dues_monthly_ksh',
    'collected_ksh':'collected_monthly_ksh',
    'arrears_new_ksh':'arrears_monthly_ksh',
    'par_percent':'avg_par_percent'
})
monthly_summary.to_csv(os.path.join(OUT_DIR, "monthly_branch_summary.csv"), index=False)

# Final save of main tables (already saved for some above)
branches.to_csv(os.path.join(OUT_DIR, "branches.csv"), index=False)
officers.to_csv(os.path.join(OUT_DIR, "officers.csv"), index=False)
customers.to_csv(os.path.join(OUT_DIR, "customers.csv"), index=False)
loans.to_csv(os.path.join(OUT_DIR, "loans.csv"), index=False)

# Zip files
zip_path = os.path.join("kechita_profile_dataset.zip")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(OUT_DIR):
        for file in files:
            zf.write(os.path.join(root, file), arcname=file)

print("Done. Files saved under:", OUT_DIR)
print("Zipped dataset:", zip_path)
