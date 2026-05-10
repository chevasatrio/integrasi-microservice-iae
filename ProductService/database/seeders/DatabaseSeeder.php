<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Bersihkan data lama
        Schema::disableForeignKeyConstraints();
        DB::table('products')->truncate();
        Schema::enableForeignKeyConstraints();

        // 2. Isi data manual (Sesuai keinginan kamu)
        DB::table('products')->insert([
            [
                'name' => 'Laptop Gaming Asus ROG',
                'description' => 'Intel i7, RAM 16GB, RTX 3060',
                'price' => 15000000.00,
                'stock' => 10,
                'category' => 'Gaming',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mouse Logitech G502',
                'description' => 'Mouse gaming wireless sensor Hero',
                'price' => 750000.00,
                'stock' => 25,
                'category' => 'Peripherals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Keyboard Keychron K2',
                'description' => 'Mechanical Keyboard 75% Layout',
                'price' => 1200000.00,
                'stock' => 15,
                'category' => 'Peripherals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Monitor Samsung 24 Inch',
                'description' => 'IPS Panel 75Hz Full HD',
                'price' => 1800000.00,
                'stock' => 5,
                'category' => 'Electronics',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}