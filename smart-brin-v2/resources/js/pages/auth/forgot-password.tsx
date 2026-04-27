// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Impor aset yang diperlukan
import patternBg from '../../assets/bg-pattern2.png';
import LogoRed from '../../assets/Logo BRIN_Lanscape_Colour.png';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<{ email: string }>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />
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
                    <div className="mb-4 text-center">
                        <img src={LogoRed} alt="Logo BRIN" className="mx-auto mb-6 h-20 w-auto" />
                        <h1 className="text-3xl font-bold text-gray-800">SMART BRIN</h1>
                    </div>

                    {/* Sub-header untuk form */}
                    <div className="mb-2 text-center">
                        <h2 className="text-xl font-semibold tracking-tight text-gray-800">Forgot password</h2>
                        <p className="mt-1 text-sm text-gray-600">Enter your email to receive a password reset link.</p>
                    </div>

                    {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block h-12 w-full rounded-xl border-gray-300 bg-gray-50 px-4 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <Button className="cursor-pointer h-12 w-full bg-red-600 text-white hover:bg-red-700" disabled={processing}>
                            {processing ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Sending link...</span>
                                </>
                            ) : (
                                'Email password reset link'
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Or, return to{' '}
                        <TextLink href={route('login')} className="font-semibold text-red-600 hover:underline">
                            log in
                        </TextLink>
                    </p>
                </div>
            </div>
        </>
    );
}