import logobrin2 from '@/assets/Logo BRIN_Lanscape_Colour.png';
import patternBg from '@/assets/bg-pattern2.png';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
  name?: string;
  title?: string;
  description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{
        backgroundImage: `url(${patternBg})`,
        backgroundRepeat: 'repeat',
        backgroundColor: '#ffffff',
        backgroundSize: '1420px',
      }}
    >
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md text-[#535151]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
              <div className="mb-1 flex items-center justify-center">
                <img src={logobrin2} alt="Logo BRIN" className="h-20 w-auto" />
              </div>
              <span className="sr-only">{title}</span>
            </Link>

            <div className="space-y-2 text-center">
              <h1 className="text-xl font-medium">{title}</h1>
              <p className="text-center text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
