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
            OauthAppsSeeder::class,
            AdminCmsSeeder::class,
            CmsMenusSeeder::class,
            TranslationsSeeder::class,
            DemoUserSeeder::class,
            DemoAgentSeeder::class,
            AgentTemplateSeeder::class,
            McpServerSeeder::class,
        ]);
    }
}
