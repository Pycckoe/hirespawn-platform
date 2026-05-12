<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class RunController extends Controller
{
    public function show(string $run): Response
    {
        return Inertia::render('RunDetail', [
            'runId' => $run,
        ]);
    }
}
