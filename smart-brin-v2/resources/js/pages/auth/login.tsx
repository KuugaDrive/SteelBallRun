import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import patternBg from '../../assets/bg-pattern2.png';
import LogoColour from '../../assets/Logo BRIN_Lanscape_Colour.png'; 
import LogoWhite from '../../assets/Logo BRIN_Lanscape_White.png';
import { Demo } from '../../components/landing-page/Demo';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />

            <div
                className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
                style={{
                    backgroundImage: `url(${patternBg})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: 'cover',
                }}
            >
                <div className="font-montserrat flex w-full max-w-4xl flex-col overflow-hidden bg-transparent md:rounded-2xl md:bg-white md:text-gray-700 md:shadow-xl md:shadow-gray-400/50 md:flex-row">
                    {/* Panel Kiri: Hanya tampil di desktop */}
                    <div className="hidden w-full flex-col items-center justify-center gap-20 bg-gradient-to-b from-[#E62F2A] via-[#E62F2A] to-[#801A17] p-4 text-white sm:p-8 md:flex md:w-1/2">
                        <div className="text-center">
                            <div className="mb-10 flex justify-center">
                                <img src={LogoWhite} alt="Logo BRIN" className="h-auto w-48" />
                            </div>
                            <h1 className="mb-2 pt-2 text-3xl font-bold md:text-4xl">SMART BRIN</h1>
                            <p className="max-w-sm text-sm text-white/90">
                                Sistem Monitoring Aktivitas dan Riset Terintegrasi - BRIN KST Samanu Samadikun
                            </p>
                        </div>
                        <div className="w-full max-w-xs">
                            <div className="rounded-xl bg-white/20 p-4 shadow-lg backdrop-blur-sm">
                                <Demo />
                            </div>
                        </div>
                    </div>

                    {/* Panel Kanan (atau Konten Utama di Mobile) */}
                    <div className="flex w-full flex-col justify-center p-4 sm:p-6 md:w-1/2 md:p-12">
                        
                        <div className="w-full max-w-sm mx-auto mb-6 md:mb-8">
                            <TextLink
                                href="/"
                                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 no-underline transition-transform hover:-translate-x-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Beranda</span>
                            </TextLink>
                        </div>

                        {/* Header untuk Mobile */}
                        <div className="text-center md:hidden">
                            <img src={LogoColour} alt="Logo BRIN" className="mx-auto mb-4 h-20 w-auto" />
                            <h1 className="mb-1 text-3xl font-bold text-gray-800">SMART BRIN</h1>
                            <p className="mx-auto max-w-sm text-sm text-gray-600">
                                Sistem Monitoring Aktivitas dan Riset Terintegrasi - BRIN KST Samanu Samadikun
                            </p>
                        </div>

                        <div className="mx-auto w-full max-w-sm">
                            {/* Header Form */}
                            <div className="my-8 md:my-0">
                                <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 md:text-left">
                                    Login to your account
                                </h2>
                            </div>

                            <form onSubmit={submit} className="space-y-5 mt-8">
                                {/* Email */}
                                <div>
                                    <Label htmlFor="email" className='text-gray-800'>Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="nama@brin.go.id"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 h-12 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 text-gray-800 tracking-wide transition-colors focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500"
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                {/* Password */}
                                <div>
                                    <Label htmlFor="password" className='text-gray-800' >Password</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="current-password"
                                            placeholder="Password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="h-12 w-full rounded-xl border text-gray-800 border-gray-300 bg-gray-50 px-4 pr-12 text-base tracking-wide transition-colors focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-800 focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                {/* Remember + Forgot */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            checked={data.remember}
                                            onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer select-none text-sm font-normal text-gray-700"
                                        >
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            className="text-sm text-red-600 no-underline hover:underline"
                                        >
                                            Lupa password?
                                        </TextLink>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="h-14 w-full cursor-pointer rounded-xl bg-red-600 text-lg text-white shadow-md transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                                                <span>Logging in...</span>
                                            </>
                                        ) : (
                                            'Login'
                                        )}
                                    </Button>
                                </div>

                            </form>

                            {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}

                            <div className="mt-8 pt-4">
                                <hr className="mb-4 border-t border-gray-200" />
                                <p className="text-center text-xs text-gray-400">© 2025 SMART BRIN. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
