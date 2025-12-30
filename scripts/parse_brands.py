"""
Parse brands from brands_temp.json and create clean brands.json
"""
import json
import os
import html

# Read the temp brands file
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
temp_file = os.path.join(project_root, 'brands_temp.json')
output_file = os.path.join(project_root, 'lib', 'data', 'brands.json')

print(f"Reading from: {temp_file}")

with open(temp_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract brands
brands = []
for brand in data['data']['data']:
    # Get logo URL from logo_fm if available
    logo_url = None
    if brand.get('logo_fm') and isinstance(brand['logo_fm'], dict):
        # Use the original size (key "0")
        logo_url = brand['logo_fm'].get('0') or brand['logo_fm'].get('80')
    
    # Decode HTML entities in title (&#39; -> ', etc.)
    title = html.unescape(brand['title'])
    
    brands.append({
        "id": brand['id'],
        "title": title,
        "logo": logo_url
    })

# Sort by title for better UX
brands.sort(key=lambda x: x['title'])

print(f"Found {len(brands)} brands")
print(f"Writing to: {output_file}")

# Ensure output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Write to output file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(brands, f, ensure_ascii=False, indent=2)

print(f"✅ Successfully created brands.json with {len(brands)} brands")

# Show some examples
print("\n📋 Sample brands:")
for i, brand in enumerate(brands[:5]):
    logo_status = "✓" if brand['logo'] else "✗"
    print(f"  {logo_status} {brand['title']} (ID: {brand['id']})")
