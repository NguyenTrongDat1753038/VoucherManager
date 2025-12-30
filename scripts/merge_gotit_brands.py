"""
Merge Got It brands into brands.json
Extract brand name + logo from Got It HTML
"""
import json
import re
import html

# Read existing Urbox brands
with open('lib/data/brands.json', 'r', encoding='utf-8') as f:
    urbox_brands = json.load(f)

# Create normalized lookup
urbox_normalized = {}
for b in urbox_brands:
    normalized = b['title'].lower().strip()
    normalized = re.sub(r'[^a-z0-9\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    urbox_normalized[normalized] = b

# Read Got It HTML
with open('test_got_it.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Extract brand items with logo and name
# Pattern: <img ... src="..." class="img-fluid" alt="Brand Name" />
pattern = r'<img[^>]*src="([^"]+)"[^>]*alt="([^"]+)"[^>]*/?>'
matches = re.findall(pattern, html_content)

gotit_brands = []
seen_names = set()

for logo_url, brand_name in matches:
    # Decode HTML entities
    brand_name = html.unescape(brand_name)
    
    # Skip generic names
    if brand_name.lower() in ['img', 'image', 'logo', 'new brand', 'vi', 'en', 'arrow', 'new logo']:
        continue
    
    # Skip icons and non-brand images
    if 'icon' in logo_url.lower() or 'arrow' in logo_url.lower() or 'gift' in logo_url.lower():
        continue
    
    # Normalize for comparison
    normalized = brand_name.lower().strip()
    normalized = re.sub(r'[^a-z0-9\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    
    # Skip if too short
    if len(normalized) < 3:
        continue
    
    # Skip if already in Urbox
    if normalized in urbox_normalized:
        continue
    
    # Skip duplicates
    if normalized in seen_names:
        continue
    
    seen_names.add(normalized)
    
    gotit_brands.append({
        'title': brand_name,
        'logo': logo_url,
        'source': 'GotIt'
    })

print(f"📊 Found {len(gotit_brands)} unique brands from Got It (not in Urbox)")

# Find max ID in current brands
max_id = max(b['id'] for b in urbox_brands)

# Add IDs to Got It brands
for i, brand in enumerate(gotit_brands, start=1):
    brand['id'] = max_id + i

# Merge brands
merged_brands = urbox_brands + gotit_brands

# Sort by title
merged_brands.sort(key=lambda x: x['title'].lower())

# Save merged brands
with open('lib/data/brands.json', 'w', encoding='utf-8') as f:
    json.dump(merged_brands, f, ensure_ascii=False, indent=2)

print(f"\n✅ Merged brands saved!")
print(f"   Total brands: {len(merged_brands)}")
print(f"   - Urbox: {len(urbox_brands)}")
print(f"   - Got It (new): {len(gotit_brands)}")

print(f"\n📋 Sample Got It brands added:")
for brand in sorted(gotit_brands, key=lambda x: x['title'])[:20]:
    print(f"   • {brand['title']}")

if len(gotit_brands) > 20:
    print(f"   ... and {len(gotit_brands) - 20} more")
