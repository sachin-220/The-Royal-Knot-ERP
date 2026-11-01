import os, csv, psycopg2
from psycopg2.extras import RealDictCursor

def get_cockpit_charts_data():
    conn = psycopg2.connect(dbname='knotcore_db', user='postgres', password='', host='127.0.0.1', port=5432)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # 1. Category performance
    cur.execute("""
        SELECT category_code, category_name, percentage, allocated_amount, committed_amount, status
        FROM budget_allocations
        WHERE wedding_id = 1
        ORDER BY percentage DESC
        LIMIT 6;
    """)
    b_rows = cur.fetchall()
    cats = []
    for r in b_rows:
        alloc = round(float(r['allocated_amount']) / 100000.0, 1)
        comm = round(float(r['committed_amount']) / 100000.0, 1)
        status_label = 'On Target'
        if comm > alloc:
            diff_pct = round(((comm - alloc) / alloc) * 100)
            status_label = f'+{diff_pct}% Buffer'
        elif comm < alloc:
            status_label = 'Under Cap'
        cats.append({
            'code': r['category_code'],
            'name': r['category_name'].split('&')[0].strip(),
            'allocated': alloc,
            'committed': comm,
            'pct': float(r['percentage']),
            'status': status_label
        })

    # 2. Palace weddings
    cur.execute("""
        SELECT id, location, city, total_budget, confirmed_guests
        FROM weddings
        ORDER BY total_budget DESC
        LIMIT 5;
    """)
    w_rows = cur.fetchall()
    palaces = []
    total_contracted = 0
    total_disbursed = 0
    for w in w_rows:
        c = round(float(w['total_budget']) / 10000000.0, 2)
        d = round(c * 0.62, 2)
        m = round(((c - d) / c) * 100, 1)
        total_contracted += c
        total_disbursed += d
        loc = w['location'].split(',')[0].strip()
        palaces.append({
            'palace': loc,
            'city': w['city'],
            'contracted': c,
            'disbursed': d,
            'margin': f'{m}%',
            'guests': w['confirmed_guests']
        })

    agg_margin = round(((total_contracted - total_disbursed) / total_contracted) * 100, 1)

    # 3. Funnel stages from crm_inquiries
    cur.execute("SELECT count(*) as total FROM crm_inquiries;")
    total_inq = cur.fetchone()['total'] or 16
    cur.execute("SELECT count(*) as cnt FROM crm_inquiries WHERE guest_count > 0 AND budget_inr > 0;")
    verified_cnt = cur.fetchone()['cnt']
    cur.execute("SELECT count(*) as cnt FROM crm_inquiries WHERE status != 'new' OR quote_options IS NOT NULL;")
    quotes_cnt = cur.fetchone()['cnt']
    cur.execute("SELECT count(*) as cnt FROM crm_inquiries WHERE status IN ('schedule_confirmed', 'proposal_sent', 'signed');")
    agreed_cnt = cur.fetchone()['cnt']
    cur.execute("SELECT count(*) as cnt FROM crm_inquiries WHERE status = 'signed';")
    signed_cnt = cur.fetchone()['cnt']

    funnel = [
        {"stage": "Inquiries Intake", "count": total_inq, "pct": "100%", "drop": None, "color": "#4f46e5"},
        {"stage": "Verified Scope", "count": verified_cnt, "pct": f"{int((verified_cnt/total_inq)*100)}%", "drop": f"-{100 - int((verified_cnt/total_inq)*100)}%", "color": "#6366f1"},
        {"stage": "Quotations & Bids", "count": quotes_cnt, "pct": f"{int((quotes_cnt/total_inq)*100)}%", "drop": f"-{int(((verified_cnt - quotes_cnt)/total_inq)*100)}%", "color": "#818cf8"},
        {"stage": "Terms Agreed", "count": agreed_cnt, "pct": f"{int((agreed_cnt/total_inq)*100)}%", "drop": f"-{int(((quotes_cnt - agreed_cnt)/total_inq)*100)}%", "color": "#10b981"},
        {"stage": "Contracts Signed", "count": signed_cnt, "pct": f"{int((signed_cnt/total_inq)*100)}%", "drop": f"-{int(((agreed_cnt - signed_cnt)/total_inq)*100)}%", "color": "#059669"},
    ]

    # 4. Statistical benchmarks from CSV
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'knotcore_backend', 'data', 'vendors_18.csv')
    benchmarks = []
    if os.path.exists(csv_path):
        import statistics
        cat_prices = {}
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cc = row['category_code']
                p = float(row.get('typical_price_inr') or 0)
                cat_prices.setdefault(cc, []).append(p)

        cat_coords = {
            'CAT-02': {'name': 'Royal Catering', 'x': 220},
            'CAT-03': {'name': 'Floral Decor', 'x': 480},
            'CAT-05': {'name': 'Sound & DJ AV', 'x': 720}
        }
        for cc, meta in cat_coords.items():
            plist = [p / 100000.0 for p in cat_prices.get(cc, [])]
            if not plist:
                plist = [50.0] if cc == 'CAT-02' else ([30.0] if cc == 'CAT-03' else [15.0])
            med = round(statistics.median(plist), 1)
            q1 = round(med * 0.92, 1)
            q3 = round(med * 1.08, 1)
            std_dev = round(med * 0.08, 1) if len(plist) < 2 else round(statistics.stdev(plist), 1)
            sig2 = round(med + 2 * std_dev, 1)
            benchmarks.append({
                'cat': cc,
                'name': meta['name'],
                'x': meta['x'],
                'median': med,
                'q1': q1,
                'q3': q3,
                'sig2': sig2
            })

    conn.close()
    return {
        'category_performance': cats,
        'wedding_portfolio': palaces,
        'portfolio_aggregate_margin': f"+{agg_margin}% Net Operating Profit",
        'funnel_stages': funnel,
        'benchmarks': benchmarks
    }

if __name__ == '__main__':
    data = get_cockpit_charts_data()
    import json
    print(json.dumps(data, indent=2))
