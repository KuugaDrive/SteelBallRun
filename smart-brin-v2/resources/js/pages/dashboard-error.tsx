import { Head, Link } from '@inertiajs/react';

type DashboardErrorProps = {
    message?: string;
    error?: string;
};

export default function DashboardError({ message, error }: DashboardErrorProps) {
    return (
        <>
            <Head title="Dashboard Error" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-red-700">Dashboard Error</h1>
                    <p className="mt-3 text-sm text-gray-700">{message ?? 'Terjadi kesalahan saat memuat dashboard.'}</p>
                    {error ? (
                        <pre className="mt-4 overflow-x-auto rounded-md bg-gray-100 p-3 text-xs text-gray-800">{error}</pre>
                    ) : null}

                    <div className="mt-6 flex gap-3">
                        <Link
                            href={route('dashboard')}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Coba Lagi
                        </Link>
                        <Link
                            href="/"
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

