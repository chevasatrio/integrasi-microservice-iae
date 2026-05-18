#!/bin/bash

echo "Starting UserService..."
cd UserService && php artisan serve --host=0.0.0.0 --port=8001 &

echo "Starting ProductService..."
cd ../ProductService && php artisan serve --host=0.0.0.0 --port=8002 &

echo "Starting OrderService React App..."
cd ../OrderService && npm run dev &

echo ""
echo "=================================="
echo " All Services Running"
echo "=================================="
echo "UserService    : http://localhost:8001"
echo "ProductService : http://localhost:8002"
echo "OrderService   : http://localhost:8003"
echo "=================================="

wait