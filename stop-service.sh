#!/bin/bash

echo "Stopping services..."

taskkill //F //IM php.exe
taskkill //F //IM node.exe

echo "All services stopped."