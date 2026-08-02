#!/bin/bash

echo "======================================"
echo " NEIGHBOUR™ FULL PLATFORM AUDIT"
echo "======================================"

echo ""
echo "DATE:"
date

echo ""
echo "======================================"
echo "1. PROJECT STRUCTURE"
echo "======================================"

find . -maxdepth 2 \
-not -path "./node_modules*" \
-not -path "./.git*" \
-type d | sort


echo ""
echo "======================================"
echo "2. BACKEND MODULES"
echo "======================================"

find services/api/src -maxdepth 2 -type d | sort


echo ""
echo "======================================"
echo "3. CONTROLLERS / API ROUTES"
echo "======================================"

for f in $(find services/api/src -name "*.controller.ts"); do
 echo ""
 echo "---- $f ----"
 grep "@Controller" $f
 grep -E "@(Get|Post|Put|Patch|Delete)\(" $f
done


echo ""
echo "======================================"
echo "4. DATABASE MODELS"
echo "======================================"

grep "^model " services/api/prisma/schema.prisma


echo ""
echo "======================================"
echo "5. FRONTEND PAGES"
echo "======================================"

find apps/web/src/app -type f | sort


echo ""
echo "======================================"
echo "6. API CLIENT FUNCTIONS"
echo "======================================"

find packages/api-client/src -type f -name "*.ts" | sort

echo ""

grep -R "apiRequest" packages/api-client/src -n


echo ""
echo "======================================"
echo "7. TECHNOLOGY STACK"
echo "======================================"

cat package.json | grep -E "\"(name|version|dependencies|devDependencies)\""

echo ""

cat services/api/package.json


echo ""
echo "======================================"
echo "8. BUILD HEALTH"
echo "======================================"

pnpm --filter @neighbour/api build


echo ""
echo "======================================"
echo "9. TYPESCRIPT CHECK"
echo "======================================"

pnpm --filter @neighbour/api typecheck


echo ""
echo "======================================"
echo "10. GIT STATUS"
echo "======================================"

git status --short


echo ""
echo "======================================"
echo " AUDIT COMPLETE"
echo "======================================"
