#!/bin/bash

echo "=========================================="
echo "Database Connection Test"
echo "=========================================="
echo ""

# Test if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed on your system"
    echo ""
    echo "To install psql on macOS:"
    echo "  brew install libpq"
    echo "  brew link --force libpq"
    echo ""
    echo "Or install full PostgreSQL client:"
    echo "  brew install postgresql@15"
    echo ""
    echo "Alternatively, use Docker exec to connect:"
    echo "  docker exec -it evaluation-framework-db psql -U postgres -d evaluation_framework"
    echo ""
    exit 1
fi

echo "✅ psql is installed"
echo ""

# Test connection to evaluation_framework database
echo "Testing connection to evaluation_framework database..."
echo "Connection string: postgresql://postgres:postgres@localhost:5432/evaluation_framework"
echo ""

PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d evaluation_framework -c "SELECT 'Connected successfully to evaluation_framework!' as status, version();" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully connected to evaluation_framework database!"
    echo ""

    # Show tables
    echo "Tables in evaluation_framework:"
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d evaluation_framework -c "\dt" 2>&1
    echo ""

    # Show user count
    echo "User count:"
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d evaluation_framework -c "SELECT COUNT(*) as user_count FROM users;" 2>&1
    echo ""
else
    echo ""
    echo "❌ Failed to connect to evaluation_framework database"
    echo ""
fi

echo "=========================================="
echo "Connection Details:"
echo "=========================================="
echo "Host: localhost"
echo "Port: 5432"
echo "Username: postgres"
echo "Password: postgres"
echo "Database: evaluation_framework (or keycloak)"
echo ""
echo "To connect manually with psql:"
echo "  PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d evaluation_framework"
echo ""
echo "To use Docker exec (always works):"
echo "  docker exec -it evaluation-framework-db psql -U postgres -d evaluation_framework"
echo ""
