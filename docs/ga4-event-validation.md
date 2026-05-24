# GA4 Event Validation Checklist

## Purpose

This checklist verifies whether CounterUAVHub's key tool interactions are being captured in Google Analytics 4.

The code-side event helper is in:

```text
web/lib/analytics.mjs
```

The GA4 measurement ID is configured in:

```text
web/app/layout.tsx
```

Current measurement ID:

```text
G-NYXPGV7XCR
```

## Event Inventory

| Event name | Trigger | Key params | Why it matters |
|------------|---------|------------|----------------|
| `drone_database_search` | Search box blur or Enter | `search_term`, `result_count` | Shows whether users search by model, brand, or RF terms |
| `drone_database_filter` | Category / brand / band filter change | `filter_type`, `filter_value` | Shows which database dimensions users care about |
| `drone_database_export` | CSV / Excel export click | `export_format`, `record_count` | Strong intent signal for data utility |
| `drone_database_record_open` | Expanding a drone record | `drone_id`, `brand`, `category` | Shows which models attract inspection |
| `drone_source_click` | Clicking source URL in a record | `drone_id`, `source_tier` | Shows trust-check behavior |
| `calculator_drone_model_select` | Selecting a drone in jammer calculator | `calculator`, `drone_id`, `brand`, `category` | Shows model-based calculation demand |
| `calculator_band_select` | Selecting a drone RF band in jammer calculator | `calculator`, `drone_id`, `frequency_mhz` | Shows band-level analysis demand |
| `calculator_preset_click` | Calculator preset buttons | `calculator`, `preset_type`, `preset_value` | Shows which calculator assumptions are useful |

## GA4 DebugView Check

Use this flow after deploying the latest build:

1. Open `https://counteruavhub.com/tools/drone-frequency-database`.
2. In GA4, go to **Admin -> DebugView** or **Reports -> Realtime**.
3. Search a model, for example `Mavic`.
4. Change a frequency band filter.
5. Expand one drone record.
6. Click CSV export.
7. Open `https://counteruavhub.com/tools/jammer-calculator`.
8. Select a drone model.
9. Click one frequency or bandwidth preset.
10. Confirm events appear in GA4 within a few minutes.

## Expected Result

At minimum, a clean validation session should show:

- `drone_database_search`
- `drone_database_filter`
- `drone_database_record_open`
- `drone_database_export`
- `calculator_drone_model_select`
- `calculator_preset_click`

## If Events Do Not Appear

Check in this order:

1. Confirm the deployed HTML includes `G-NYXPGV7XCR`.
2. Confirm browser ad blockers are not blocking Google Analytics.
3. Confirm production deployment includes the latest commit.
4. Open browser DevTools and check whether `window.gtag` exists.
5. Run local validation:

```bash
cd web
npm run test:site
npm run build
```

## Weekly Review Questions

- Which search terms repeat?
- Which bands are selected most often?
- Are users exporting data or only browsing?
- Which drone models get record opens?
- Are calculators being used after users enter from database pages?
- Do source clicks cluster around `third-party` records, suggesting trust concerns?
