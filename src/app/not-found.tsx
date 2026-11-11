import Link from 'next/link';
import { Bike, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center text-slate-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
        <Bike className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The rental page or resource you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button className="bg-[#fc8019] text-[#282c3f] hover:bg-[#e07014] font-bold gap-2">
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Button>
        </Link>
        <Link href="/rider">
          <Button variant="outline" className="border-slate-300">
            Rider Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}
