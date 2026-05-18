<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            AgentCategorySeeder::class,
            AgentSeeder::class,
            PowerPackSeeder::class,
            LlmModelsSeeder::class,
            AdminCmsSeeder::class,
            CmsMenusSeeder::class,
            TranslationsSeeder::class,
            DemoUserSeeder::class,
        ]);
    }
}
