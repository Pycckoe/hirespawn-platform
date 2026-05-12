<?php

namespace Database\Seeders;

use App\Models\AgentCategory;
use Illuminate\Database\Seeder;

class AgentCategorySeeder extends Seeder
{
    /**
     * Categories mirror the CATEGORIES array in resources/js/lib/shared.jsx
     * so the catalog filters resolve to real DB rows.
     */
    public function run(): void
    {
        $categories = [
            ['key' => 'sales',    'label' => 'Sales',       'icon' => '◇'],
            ['key' => 'hr',       'label' => 'HR',          'icon' => '◈'],
            ['key' => 'finance',  'label' => 'Finance',     'icon' => '◉'],
            ['key' => 'eng',      'label' => 'Engineering', 'icon' => '◌'],
            ['key' => 'support',  'label' => 'Support',     'icon' => '◍'],
            ['key' => 'legal',    'label' => 'Legal',       'icon' => '◎'],
            ['key' => 'design',   'label' => 'Design',      'icon' => '◐'],
            ['key' => 'research', 'label' => 'Research',    'icon' => '◑'],
        ];

        foreach ($categories as $i => $cat) {
            AgentCategory::updateOrCreate(
                ['slug' => $cat['key']],
                [
                    'name' => $cat['label'],
                    'icon' => $cat['icon'],
                    'sort_order' => $i,
                ],
            );
        }
    }
}
