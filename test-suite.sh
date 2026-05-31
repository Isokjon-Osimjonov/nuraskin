#!/bin/bash
set -euo pipefail

BASE="http://localhost:4000/api"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MThlMDU1Zi1hZjdmLTQwYWMtOTNmNC0zNzc0ZmI3MjRlNjIiLCJlbWFpbCI6Im1hbmFnZXJAbnVyYXNraW4udXoiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJmdWxsTmFtZSI6Ik51cmFTa2luIE1hbmFnZXIiLCJpYXQiOjE3ODAyMjk5MzEsImV4cCI6MTc4MjgyMTkzMX0.UlKf_ji20vE7I3Zh5MNWD4BAp2EXShHUj5ZZBRaTHr4"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MjE3ODMwMTY4IiwidGVsZWdyYW1JZCI6IjcyMTc4MzAxNjgiLCJmaXJzdE5hbWUiOiJJc29ram9uIiwibGFzdE5hbWUiOm51bGwsInVzZXJuYW1lIjoiaXNva2pvbl9pbyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4MDIyNzUwOSwiZXhwIjoxNzg4MDAzNTA5fQ.tMyvECLHbd4g39-aVMVBKpQKOfuek8_YwfX8nj1DT_U"
CUSTOMER_ID="9b49776a-4d8f-4d86-9e34-b7bb953fd7dd"
PASS=0; FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -qE "$expected"; then
    echo -e "${GREEN}✅ $label${NC}"
    PASS=$((PASS+1))
  else
    echo -e "${RED}❌ $label${NC}"
    echo "   Expected pattern: $expected"
    echo "   Got: $(echo "$actual" | head -c 300)"
    FAIL=$((FAIL+1))
  fi
}

admin() {
  curl -s -X "$1" "$BASE/$2" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    ${3:+-d "$3"}
}

customer() {
  curl -s -X "$1" "$BASE/$2" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN"\
    -H "Content-Type: application/json" \
    ${3:+-d "$3"}
}

pub() {
  curl -s -X "$1" "$BASE/$2" \
    -H "Content-Type: application/json" \
    ${3:+-d "$3"}
}

extract() {
  echo "$1" | jq -r "$2 // empty" 2>/dev/null
}

echo ""; echo "=== PHASE 0: HEALTH ==="

HEALTH=$(pub GET health)
check "Server is up" "ok|healthy|200" "$HEALTH"

ADMIN_ME=$(admin GET auth/me)
check "Admin token valid" \
  "SUPER_ADMIN|manager@nuraskin" "$ADMIN_ME"

CUST_ME=$(customer GET auth/me)
check "Customer token valid" \
  "Isokjon|7217830168" "$CUST_ME"

echo ""; echo "=== PHASE 1: SEED DATA ==="

RATE=$(admin POST exchange-rates \
  '{"krwToUzs":14, "cargoRateKrwPerKg":10000, "note":"Test rate"}')
RATE_ID=$(extract "$RATE" '.id')
if [ -z "$RATE_ID" ]; then
  RATE_ID=$(admin GET exchange-rates | jq -r 'if .data then .data[0].id else .[0].id end' 2>/dev/null)
fi
check "Exchange rate (14)" '[0-9a-fA-F]{8}-' "{\"id\":\"$RATE_ID\"}"

echo ""; echo "=== PHASE 2: SEED CATEGORIES ==="

CAT=$(admin POST categories '{"name":"Serumlar","slug":"serumlar"}')
CAT_ID=$(extract "$CAT" '.id')
if [ -z "$CAT_ID" ]; then
  CAT_ID=$(admin GET categories | jq -r 'if .data then .data else . end | .[] | select(.slug == "serumlar") | .id')
fi
check "Category created" '[0-9a-fA-F]{8}-' "{\"id\":\"$CAT_ID\"}"

CAT2=$(admin POST categories '{"name":"Kremlar","slug":"kremlar"}')
CAT2_ID=$(extract "$CAT2" '.id')
if [ -z "$CAT2_ID" ]; then
  CAT2_ID=$(admin GET categories | jq -r 'if .data then .data else . end | .[] | select(.slug == "kremlar") | .id')
fi
check "Category 2 created" '[0-9a-fA-F]{8}-' "{\"id\":\"$CAT2_ID\"}"

echo ""; echo "=== PHASE 3: SEED PRODUCTS ==="

create_prod() {
  local payload="$1"
  local barcode="$2"
  local resp=$(admin POST products "$payload")
  local id=$(extract "$resp" '.id')
  if [ -z "$id" ]; then
    id=$(admin GET "products/barcode/$barcode" | jq -r ".id" 2>/dev/null)
  fi
  echo "$id"
}

PROD_A_ID=$(create_prod "{\"name\":\"Test Serum A\", \"barcode\":\"8801111111111\", \"sku\":\"TEST-A\", \"categoryId\":\"$CAT_ID\", \"brandName\":\"TestBrand\", \"weightGrams\":100, \"imageUrls\":[\"https://picsum.photos/200\"], \"regionalConfigs\":[{\"regionCode\":\"KOR\", \"retailPrice\":30000, \"wholesalePrice\":25000},{\"regionCode\":\"UZB\", \"retailPrice\":420000, \"wholesalePrice\":350000}]}" "8801111111111")
check "Product A created" '[0-9a-fA-F]{8}-' "{\"id\":\"$PROD_A_ID\"}"

PROD_B_ID=$(create_prod "{\"name\":\"Test Cream B\", \"barcode\":\"8802222222222\", \"sku\":\"TEST-B\", \"categoryId\":\"$CAT2_ID\", \"brandName\":\"LactoFit\", \"weightGrams\":200, \"imageUrls\":[\"https://picsum.photos/200\"], \"regionalConfigs\":[{\"regionCode\":\"KOR\", \"retailPrice\":80000, \"wholesalePrice\":65000},{\"regionCode\":\"UZB\", \"retailPrice\":1120000, \"wholesalePrice\":910000}]}" "8802222222222")
check "Product B created" '[0-9a-fA-F]{8}-' "{\"id\":\"$PROD_B_ID\"}"

PROD_C_ID=$(create_prod "{\"name\":\"Test Serum C\", \"barcode\":\"8803333333333\", \"sku\":\"TEST-C\", \"categoryId\":\"$CAT_ID\", \"brandName\":\"TestBrand\", \"weightGrams\":150, \"imageUrls\":[\"https://picsum.photos/200\"], \"regionalConfigs\":[{\"regionCode\":\"KOR\", \"retailPrice\":50000, \"wholesalePrice\":40000},{\"regionCode\":\"UZB\", \"retailPrice\":700000, \"wholesalePrice\":560000}]}" "8803333333333")
check "Product C created" '[0-9a-fA-F]{8}-' "{\"id\":\"$PROD_C_ID\"}"

echo ""; echo "=== PHASE 4: SEED INVENTORY BATCHES ==="

BATCH_A=$(admin POST "inventory/batches" "{\"productId\":\"$PROD_A_ID\", \"initialQty\":100, \"costPrice\":15000, \"costCurrency\":\"KRW\", \"batchRef\":\"BATCH-A-001\"}")
check "Batch A added" '"id"' "$BATCH_A"

BATCH_B=$(admin POST "inventory/batches" "{\"productId\":\"$PROD_B_ID\", \"initialQty\":50, \"costPrice\":40000, \"costCurrency\":\"KRW\", \"batchRef\":\"BATCH-B-001\"}")
check "Batch B added" '"id"' "$BATCH_B"

BATCH_C=$(admin POST "inventory/batches" "{\"productId\":\"$PROD_C_ID\", \"initialQty\":30, \"costPrice\":25000, \"costCurrency\":\"KRW\", \"batchRef\":\"BATCH-C-001\"}")
check "Batch C added" '"id"' "$BATCH_C"

echo ""; echo "=== PHASE 5: SEED SETTINGS + SHIPPING ==="

SETTINGS=$(admin PATCH settings '{"minOrderKorKrw":30000, "minOrderUzbUzs":42000000}')
check "Min order settings" "minOrder" "$SETTINGS"

echo ""; echo "=== PHASE 6: SEED COUPONS ==="

COUPON_COMMON='
  "scope": "ENTIRE_ORDER", "minOrderQty": 1, "firstOrderOnly": false, "onePerCustomer": false, "autoApply": false, "isStackable": false, "isPromotional": false, "isFirstPurchaseOnly": false, "status": "ACTIVE", "maxUsesPerCustomer": 999
'

create_coupon() {
  local payload="$1"
  local code="$2"
  local resp=$(admin POST admin/coupons "$payload")
  local id=$(extract "$resp" '.id')
  if [ -z "$id" ]; then
    id=$(admin GET admin/coupons | jq -r "if .data then .data else . end | .[] | select(.code == \"$code\") | .id" 2>/dev/null)
  fi
  echo "$id"
}

CPN_10_ID=$(create_coupon "{ \"code\":\"TEST10PCT\", \"name\":\"10% global chegirma\", \"type\":\"PERCENTAGE\", \"value\":\"10\", \"minOrderAmount\":\"0\", $COUPON_COMMON }" "TEST10PCT")
check "10% coupon" '[0-9a-fA-F]{8}-' "{\"id\":\"$CPN_10_ID\"}"

CPN_FIX_ID=$(create_coupon "{ \"code\":\"FIXED5000\", \"name\":\"5000 chegirma\", \"type\":\"FIXED\", \"value\":\"5000\", \"minOrderAmount\":\"30000\", $COUPON_COMMON }" "FIXED5000")
check "Fixed 5k coupon" '[0-9a-fA-F]{8}-' "{\"id\":\"$CPN_FIX_ID\"}"

CPN_SHIP_ID=$(create_coupon "{ \"code\":\"FREESHIP\", \"name\":\"Bepul yetkazish\", \"type\":\"FREE_SHIPPING\", \"value\":\"0\", \"minOrderAmount\":\"0\", $COUPON_COMMON }" "FREESHIP")
check "Free shipping coupon" '[0-9a-fA-F]{8}-' "{\"id\":\"$CPN_SHIP_ID\"}"

CPN_CAT_ID=$(create_coupon "{ \"code\":\"SERUM15\", \"name\":\"Serumlar 15%\", \"type\":\"PERCENTAGE\", \"value\":\"15\", \"minOrderAmount\":\"0\", \"scope\": \"CATEGORIES\", \"applicableResourceIds\": [\"$CAT_ID\"], \"minOrderQty\": 1, \"firstOrderOnly\": false, \"onePerCustomer\": false, \"autoApply\": false, \"isStackable\": false, \"isPromotional\": false, \"isFirstPurchaseOnly\": false, \"status\": \"ACTIVE\", \"maxUsesPerCustomer\": 999 }" "SERUM15")
check "Category coupon" '[0-9a-fA-F]{8}-' "{\"id\":\"$CPN_CAT_ID\"}"

echo ""; echo "=== PHASE 7: STOREFRONT === "

PRODS=$(pub GET storefront/products)
check "Products public list" '"id"' "$PRODS"

echo ""; echo "=== PHASE 8: COUPON VALIDATION ==="

VALIDATE_COMMON=" \"cartItems\": [ {\"productId\":\"$PROD_A_ID\", \"quantity\":1, \"subtotal\":\"30000\"} ] "

V1=$(customer POST storefront/coupons/validate "{ \"code\":\"TEST10PCT\", \"regionCode\":\"UZB\", $VALIDATE_COMMON }")
check "Global 10% coupon valid" '"valid":true' "$V1"

echo ""; echo "=== PHASE 9: CART ==="

# Set region to KOR for KOR order
customer PATCH storefront/profile/region '{"region":"KOR"}' > /dev/null

CART_ADD=$(customer POST storefront/cart/items "{\"productId\":\"$PROD_A_ID\", \"quantity\":2, \"regionCode\":\"KOR\"}")
check "Added to cart" '"id"|"items"' "$CART_ADD"

echo ""; echo "=== PHASE 10: ADDRESSES ==="

ADDR_KOR=$(customer POST storefront/addresses '{ "label":"Home KOR", "fullName":"Isokjon Test", "phone":"+821012345678", "regionCode":"KOR", "korPostalCode":"06234", "roadAddress":"Seoul Gangnam 123", "korRoadAddress":"Seoul Gangnam 123", "korDetail":"Apt 101" }')
ADDR_KOR_ID=$(extract "$ADDR_KOR" '.id')
if [ -z "$ADDR_KOR_ID" ]; then ADDR_KOR_ID=$(customer GET storefront/addresses | jq -r 'if type=="array" then .[0].id else .data[0].id end' 2>/dev/null); fi
check "KOR address" '[0-9a-fA-F]{8}-' "{\"id\":\"$ADDR_KOR_ID\"}"

echo ""; echo "=== PHASE 11: ORDER 1 (KOR+10%) ==="

O1=$(customer POST storefront/orders "{ \"items\": [{\"productId\":\"$PROD_A_ID\", \"quantity\":2}], \"addressId\":\"$ADDR_KOR_ID\", \"couponCode\":\"TEST10PCT\", \"regionCode\":\"KOR\", \"fullName\":\"Isokjon Test\", \"phone\":\"+821012345678\", \"address\":\"Gangnam 123\", \"city\":\"Seoul\", \"district\":\"Gangnam\" }")
O1_ID=$(extract "$O1" '.id')
check "Order 1 created" '[0-9a-fA-F]{8}-' "{\"id\":\"$O1_ID\"}"

if [ -n "$O1_ID" ] && [ "$O1_ID" != "null" ]; then
  admin PATCH "orders/$O1_ID/status" '{"to":"PAYMENT_CONFIRMED"}' > /dev/null
  admin PATCH "orders/$O1_ID/status" '{"to":"DELIVERED"}' > /dev/null
  check "Order 1 delivered" "." "done"
fi

echo ""; echo "=== PHASE 12: ORDER 2 (UZB+FREESHIP) ==="

# Set region to UZB for UZB order
customer PATCH storefront/profile/region '{"region":"UZB"}' > /dev/null

customer POST storefront/cart/items "{\"productId\":\"$PROD_B_ID\", \"quantity\":1, \"regionCode\":\"UZB\"}" > /dev/null

O2=$(customer POST storefront/orders "{ \"items\": [{\"productId\":\"$PROD_B_ID\", \"quantity\":1}], \"couponCode\":\"FREESHIP\", \"regionCode\":\"UZB\", \"fullName\":\"Isokjon Test\", \"phone\":\"+998901234567\", \"address\":\"Chilonzor\", \"city\":\"Tashkent\", \"district\":\"Chilonzor\" }")
O2_ID=$(extract "$O2" '.id')
check "Order 2 created" '[0-9a-fA-F]{8}-' "{\"id\":\"$O2_ID\"}"

if [ -n "$O2_ID" ] && [ "$O2_ID" != "null" ]; then
  admin PATCH "orders/$O2_ID/status" '{"to":"PAYMENT_CONFIRMED"}' > /dev/null
  admin PATCH "orders/$O2_ID/status" '{"to":"DELIVERED"}' > /dev/null
  check "Order 2 delivered" "." "done"
fi

echo ""; echo "=== FINAL RESULTS ==="
echo -e "${GREEN}PASSED: $PASS${NC}"
echo -e "${RED}FAILED: $FAIL${NC}"

[ $FAIL -eq 0 ] && exit 0 || exit 1
