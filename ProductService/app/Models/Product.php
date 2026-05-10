<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // Pastikan baris ini ada
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory; // Pastikan baris ini ada

    protected $fillable = ['name', 'description', 'price', 'stock', 'category'];
}