#!/bin/bash
# Script to fix the SQL migration scripts for Azure SQL compatibility

# Path to SQL migration folder
SQL_DIR="$(pwd)/MoviesApp/sql_migration"

# Add commas to column definitions in create_schema.sql
echo "===== Fixing SQL schema script ====="
sed -i.bak -E 's/([^ ])$/\1,/g' "$SQL_DIR/create_schema.sql"
# Remove comma after the last column in each table definition
sed -i.bak -E 's/,\s+\);/\n    \);/g' "$SQL_DIR/create_schema.sql"

# Fix the INSERT statements - add commas between values
echo "===== Fixing SQL data scripts ====="
# Fix movies_titles_data.sql - replace single quotes between column values with commas
sed -i.bak -E "s/VALUES\('([^']+)''/VALUES('\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_titles_data.sql"
sed -i.bak -E "s/'([^']+)'$/','\\1');/g" "$SQL_DIR/movies_titles_data.sql"

# Fix movies_users_data.sql
sed -i.bak -E "s/VALUES\('([^']+)''/VALUES('\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_users_data.sql"
sed -i.bak -E "s/'([^']+)'$/','\\1');/g" "$SQL_DIR/movies_users_data.sql"

# Fix movies_ratings_data.sql
sed -i.bak -E "s/VALUES\('([^']+)''/VALUES('\\1','/g" "$SQL_DIR/movies_ratings_data.sql"
sed -i.bak -E "s/'([^']+)''/','\\1','/g" "$SQL_DIR/movies_ratings_data.sql"
sed -i.bak -E "s/'([^']+)'$/','\\1');/g" "$SQL_DIR/movies_ratings_data.sql"

# Regenerate the complete migration script
echo "===== Regenerating complete migration script ====="
cat "$SQL_DIR/create_schema.sql" > "$SQL_DIR/complete_migration.sql"
echo "" >> "$SQL_DIR/complete_migration.sql"
echo "-- Data from local SQLite database" >> "$SQL_DIR/complete_migration.sql"
echo "SET IDENTITY_INSERT movies_users ON;" >> "$SQL_DIR/complete_migration.sql"
cat "$SQL_DIR/movies_users_data.sql" >> "$SQL_DIR/complete_migration.sql"
echo "SET IDENTITY_INSERT movies_users OFF;" >> "$SQL_DIR/complete_migration.sql"
echo "" >> "$SQL_DIR/complete_migration.sql"
cat "$SQL_DIR/movies_titles_data.sql" >> "$SQL_DIR/complete_migration.sql"
echo "" >> "$SQL_DIR/complete_migration.sql"
cat "$SQL_DIR/movies_ratings_data.sql" >> "$SQL_DIR/complete_migration.sql"

echo "===== SQL scripts fixed successfully ====="
echo "The fixed SQL scripts are now ready to be executed in Azure SQL."
echo "Updated file: $SQL_DIR/complete_migration.sql"
