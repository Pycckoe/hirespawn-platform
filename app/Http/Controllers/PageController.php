<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('Home');
    }

    public function pricing(): Response
    {
        return Inertia::render('Pricing');
    }

    public function hire(): Response
    {
        return Inertia::render('Hire');
    }

    public function power(): Response
    {
        return Inertia::render('PowerCheckout');
    }

    public function about(): Response
    {
        return Inertia::render('About');
    }

    public function customers(): Response
    {
        return Inertia::render('Customers');
    }

    public function docs(): Response
    {
        return Inertia::render('Docs');
    }

    public function security(): Response
    {
        return Inertia::render('Security');
    }

    public function status(): Response
    {
        return Inertia::render('Status');
    }

    public function changelog(): Response
    {
        return Inertia::render('Changelog');
    }

    public function legal(): Response
    {
        return Inertia::render('Legal');
    }

    public function emails(): Response
    {
        return Inertia::render('Emails');
    }

    public function onboarding(): Response
    {
        return Inertia::render('Onboarding');
    }

    public function settings(): Response
    {
        return Inertia::render('Settings');
    }

    public function blogIndex(): Response
    {
        return Inertia::render('Blog/Index');
    }

    public function blogPost(string $slug): Response
    {
        return Inertia::render('Blog/Post', ['slug' => $slug]);
    }
}
