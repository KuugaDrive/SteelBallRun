import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react'; // Import useEffect
import patternBg from '../assets/bg-pattern.png';
import logoBrin from '../assets/logo-brin-full.png';
import { Demo } from '../components/landing-page/Demo';

export default function Landingpage() {
    useEffect(() => {
        // Add a class to the body to prevent scrolling on larger screens
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Adjust breakpoint as needed (e.g., 768px for md breakpoint in Tailwind CSS)
                document.body.classList.add('no-scroll-desktop');
            } else {
                document.body.classList.remove('no-scroll-desktop');
            }
        };

        handleResize(); // Call on initial render
        window.addEventListener('resize', handleResize); // Add event listener for resize

        return () => {
            window.removeEventListener('resize', handleResize); // Clean up event listener
        };
    }, []);

    return (
        <>
            <Head title="Landingpage">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                {/* Add a style tag for the no-scroll-desktop class */}
                <style>{`
                    .no-scroll-desktop {
                        overflow: hidden;
                    }
                    /* You might want to ensure scrolling is enabled on mobile */
                    @media (max-width: 767px) { /* Adjust breakpoint as needed */
                        .no-scroll-desktop {
                            overflow: auto;
                        }
                    }
                `}</style>
            </Head>

            <div
                className="min-h-screen bg-white bg-repeat text-[#000000]"
                style={{
                    backgroundImage: `url(${patternBg})`,
                    backgroundSize: '1420px',
                }}
            >
                <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
                    <img src={logoBrin} alt="Logo BRIN" className="w-45 sm:w-60" />
                </header>

                <main className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-12 lg:flex-row">
                    <div className="mb-12 max-w-xl">
                        <h1 className="font-poppins mb-5 text-3xl font-bold sm:text-5xl">SMART BRIN</h1>
                        <p className="font-montserrat mb-1 text-xl font-bold sm:text-3xl">
                            Sistem Monitoring Aktivitas dan Riset Terintegrasi - BRIN
                        </p>
                        <p className="font-montserrat mb-5 text-xl font-bold sm:text-3xl">KST Samaun Samadikun</p>
                        <p className="font-montserrat mb-6 text-sm text-[#535151] sm:text-xl">
                            SMART BRIN simplifies the management and optimization of LLM processes for BRIN, offering intuitive tools and clear
                            insights.
                        </p>

                        <div className="font-poppins flex flex-col gap-4 pt-14 font-bold sm:flex-row">
                            <Link
                                href={route('login')}
                                className="rounded-md border bg-[#ffffff] px-5 py-3 text-center text-[#E62F2A] shadow-xl inset-shadow-xs"
                            >
                                Get Started
                            </Link>
                            <a
                                href="https://www.youtube.com/watch?v=3qPGlEb5Gaw"
                                target="_blank"
                                className="rounded-md border bg-[#E62F2A] px-5 py-3 text-center text-[#ffffff] shadow-xl inset-shadow-xs"
                            >
                                View Demo Video
                            </a>
                        </div>
                    </div>

                    <div className="-mt-10 w-full max-w-lg md:mt-0 lg:mb-30">
                        <div className="rounded-xl bg-white p-4 shadow-lg inset-shadow-sm">
                            <Demo />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
