#!/bin/bash

echo "========================================"
echo "      NEIGHBOUR™ BUILD AUDIT REPORT"
echo "========================================"

echo ""
echo "DATE:"
date

echo ""
echo "========================================"
echo "PROJECT STRUCTURE"
echo "========================================"

find . -maxdepth 2 -type d \
-not -path "./node_modules*" \
-not -path "./.git*" \
| sort


echo ""
echo "========================================"
echo "FRONTEND PAGES"
echo "========================================"

find apps/web/src/app -type f \
| sort


echo ""
echo "========================================"
echo "FRONTEND COMPONENTS"
echo "========================================"

find apps/web/src/components -type f 2>/dev/null \
| sort


echo ""
echo "========================================"
echo "API CLIENT FILES"
echo "========================================"

find packages/api-client/src -type f \
| sort


echo ""
echo "========================================"
echo "API CLIENT EXPORTS"
echo "========================================"

grep -R "export \*" packages/api-client/src/index.ts


echo ""
echo "========================================"
echo "BACKEND MODULES"
echo "========================================"

find services/api/src -name "*.module.ts" \
| sort


echo ""
echo "========================================"
echo "BACKEND CONTROLLERS"
echo "========================================"

find services/api/src -name "*.controller.ts" \
| sort


echo ""
echo "========================================"
echo "BACKEND SERVICES"
echo "========================================"

find services/api/src -name "*.service.ts" \
| sort


echo ""
echo "========================================"
echo "PRISMA MODELS"
echo "========================================"

grep "^model " services/api/prisma/schema.prisma


echo ""
echo "========================================"
echo "DATABASE TABLE MAP"
echo "========================================"

grep "@@map" services/api/prisma/schema.prisma


echo ""
echo "========================================"
echo "API ROUTE DECORATORS"
echo "========================================"

grep -R "@Controller\|@Get\|@Post\|@Patch\|@Delete" \
services/api/src \
--include="*.controller.ts"


echo ""
echo "========================================"
echo "COMMUNITY REFERENCES"
echo "========================================"

grep -R "Community\|community" \
services/api/src \
apps/web/src \
packages/api-client/src \
--include="*.ts" \
--include="*.tsx" \
| head -100


echo ""
echo "========================================"
echo "MEMBERSHIP REFERENCES"
echo "========================================"

grep -R "Membership\|membership" \
services/api/src \
packages/api-client/src \
apps/web/src \
--include="*.ts" \
--include="*.tsx" \
| head -100


echo ""
echo "========================================"
echo "POST / FEED REFERENCES"
echo "========================================"

grep -R "Post\|post\|Feed\|feed" \
services/api/src \
packages/api-client/src \
apps/web/src \
--include="*.ts" \
--include="*.tsx" \
| head -150


echo ""
echo "========================================"
echo "POSSIBLE TODO ITEMS"
echo "========================================"

grep -R "TODO\|FIXME\|IMPLEMENT" . \
-not -path "./node_modules/*" \
2>/dev/null \
| head -100


echo ""
echo "========================================"
echo "AUDIT COMPLETE"
echo "========================================"

