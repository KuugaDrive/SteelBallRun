import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Impor aset yang diperlukan
import patternBg from '../../assets/bg-pattern2.png';
import LogoRed from '../../assets/Logo BRIN_Lanscape_Colour.png'; // Pastikan path logo ini benar

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password" />
            <div
                className="flex min-h-screen items-center justify-center bg-gray-100 p-4"
                style={{
                    backgroundImage: `url(${patternBg})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: 'cover',
                }}
            >
                <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-xl shadow-gray-400/50 text-[#535151]">
                    {/* Header dengan Logo dan Branding */}
                    <div className="mb-2 text-center">
                        <img src={LogoRed} alt="Logo BRIN" className="mx-auto mb-2 h-20 w-auto" />
                        <h1 className="text-3xl font-bold text-[#535151]">SMART BRIN</h1>
                    </div>

                    {/* Sub-header untuk form */}
                    <div className=" text-center">
                        <h2 className="text-xl font-semibold tracking-tight text-[#535151]">Reset Your Password</h2>
                        <p className=" text-sm text-gray-600">Please enter your new password below.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email (Read-only) */}
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                className="mt-1 block h-12 w-full cursor-not-allowed rounded-xl border-gray-300 bg-gray-200 px-4 text-gray-500"
                                readOnly
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* Password Baru */}
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative mt-1">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    className="h-12 w-full rounded-xl border-gray-300 bg-gray-50 px-4 pr-12 focus:border-red-500 focus:ring-red-500"
                                    autoFocus
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Enter new password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        {/* Konfirmasi Password */}
                        <div>
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <div className="relative mt-1">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    className="h-12 w-full rounded-xl border-gray-300 bg-gray-50 px-4 pr-12 focus:border-red-500 focus:ring-red-500"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Confirm new password"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        <div className="pt-2">
                             <Button className="cursor-pointer h-14 w-full bg-red-600 text-lg hover:bg-red-700 text-white" disabled={processing}>
                                {processing ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin te" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Footer Copyright */}
                    <div className="mt-8 pt-4">
                        <hr className="mb-4 border-t border-gray-200" />
                        <p className="text-center text-xs text-gray-400">© 2025 SMART BRIN. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </>
    );
}